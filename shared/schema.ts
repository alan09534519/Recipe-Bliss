import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const RECIPE_CATEGORIES = ["主食", "湯品", "小菜", "甜點", "飲品"] as const;
export type RecipeCategory = typeof RECIPE_CATEGORIES[number];

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrls: text("image_urls").array().default(sql`'{}'::text[]`),
  ingredients: text("ingredients").array().notNull(),
  steps: text("steps").array().notNull(),
  servings: integer("servings").default(2),
  cookTime: text("cook_time"),
  category: text("category"),
  sourceUrl: text("source_url"),
});

export const insertRecipeSchema = createInsertSchema(recipes, {
  name: z.string().min(1, "菜名不能為空"),
  imageUrls: z.array(z.string()).max(5, "最多只能上傳5張圖片").optional().default([]),
  ingredients: z.array(z.string().min(1)).min(1, "至少需要一個食材"),
  steps: z.array(z.string().min(1)).min(1, "至少需要一個步驟"),
  servings: z.number().int().min(1).max(20).optional().default(2),
  sourceUrl: z.string().url("請輸入有效的網址").optional().nullable(),
}).omit({
  id: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
