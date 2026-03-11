import { Hono } from "hono";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { createInsertSchema } from "drizzle-zod";
import { sValidator } from "@hono/zod-validator";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- データベース定義 (src/db/schema.ts 相当) ---
export const messages = sqliteTable("messages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    content: text("content").notNull(),
});

// --- アプリケーション実装 (src/index.ts 相当) ---
type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// 1. バリデーションルール (入力チェック) を作る
// createInsertSchema はテーブル定義から Zod スキーマを自動生成してくれます
const insertMessageSchema = createInsertSchema(messages, {
    name: z.string().min(1, "名前を入力してください"),
    content: z.string().min(1, "本文を入力してください"),
});

// 2. 投稿 API
app.post("/messages", sValidator("json", insertMessageSchema), async (c) => {
    const db = drizzle(c.env.DB);
    const data = c.req.valid("json"); // チェック済みのきれいなデータ

    // DB への保存 (INSERT)
    // returning() を付けると、保存された後のデータ(idなど)が返ってきます
    const result = await db.insert(messages).values(data).returning().get();

    return c.json(result, 201);
});

// 3. 一覧取得 API
app.get("/messages", async (c) => {
    const db = drizzle(c.env.DB);

    // DB から全件取得 (SELECT ALL)
    const allMessages = await db.select().from(messages).all();

    return c.json(allMessages);
});

export default app;
