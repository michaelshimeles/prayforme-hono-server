import { Pool } from "@neondatabase/serverless";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";
import { moderatedRequests, requests } from "./db/schema";
import { bearerAuth } from "hono/bearer-auth";

export type Env = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  BEARER_TOKEN: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://prayforme.fyi"],
    allowMethods: ["POST", "GET"],
    maxAge: 600,
  })
);

// Bearer Auth
app.use("*", async (c, next) => {
  const bearer = bearerAuth({ token: c.env.BEARER_TOKEN });
  return bearer(c, next);
});

app.get("/", (c) => {
  return c.text("Hello World");
});

app.get("/prayer-requests", async (c) => {
  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });

    const db = drizzle(client);

    const result = await db
      .select()
      .from(requests)
      .orderBy(desc(requests.created_at));

    return c.json({
      result,
    });
  } catch (error) {}
});

app.post("/pray-tap", async (c) => {
  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });

    const db = drizzle(client);

    const { requestId, numOfPrayers } = await c.req.json();

    const result = await db
      .update(requests)
      .set({
        num_of_prayers: numOfPrayers,
      })
      .where(eq(requests.request_id, requestId!));

    return c.json({
      result,
    });
  } catch (error) {}
});

app.post("/create-request", async (c) => {
  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });

    const openai = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY!,
    });

    const db = drizzle(client);

    const { requestId, request, numOfPrayers } = await c.req.json();

    const userAgent = c.req.header("User-Agent");
    const location = `${c.req.raw.cf?.city}, ${c.req.raw.cf?.region}, ${c.req.raw.cf?.postalCode}, ${c.req.raw.cf?.timezone}, ${c.req.raw.cf?.colo}, ISP: ${c.req.raw.cf?.asOrganization}`;

    const moderation = await openai.moderations.create({
      input: request!,
    });

    if (moderation?.results?.[0]?.flagged) {
      const result = await db
        .insert(moderatedRequests)
        .values({
          message: request!,
          ip_address: "",
          device: userAgent!,
          location: location,
          request_id: requestId!,
        })
        .returning();

      return c.json({
        result,
        flagged: true,
      });
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a AI Bible assistant, your job is to send an encouraging bible verse for the prayer request that is given to you. Don't add anything else, just the bible verse",
        },
        {
          role: "user",
          content: "The prayer request:" + request,
        },
      ],
      model: "gpt-4o",
    });

    const result = await db
      .insert(requests)
      .values({
        request_id: requestId!,
        content: request!,
        num_of_prayers: numOfPrayers!,
        encouragement: completion?.choices?.[0]?.message?.content!,
      })
      .returning();

    return c.json({
      result,
    });
  } catch (error) {
    console.log(error);
    return c.json(
      {
        error,
      },
      400
    );
  }
});

export default app;
