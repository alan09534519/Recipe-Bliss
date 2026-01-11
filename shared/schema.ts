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
  imageUrl: text("image_url"),
  ingredients: text("ingredients").array().notNull(),
  steps: text("steps").array().notNull(),
  servings: integer("servings").default(2),
  cookTime: text("cook_time"),
  category: text("category"),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
