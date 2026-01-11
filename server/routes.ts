import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecipeSchema } from "@shared/schema";

const updateRecipeSchema = insertRecipeSchema.partial();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/recipes", async (_req, res) => {
    const recipes = await storage.getAllRecipes();
    res.json(recipes);
  });

  app.get("/api/recipes/:id", async (req, res) => {
    const recipe = await storage.getRecipe(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json(recipe);
  });

  app.post("/api/recipes", async (req, res) => {
    const result = insertRecipeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid recipe data", errors: result.error.errors });
    }
    const recipe = await storage.createRecipe(result.data);
    res.status(201).json(recipe);
  });

  app.patch("/api/recipes/:id", async (req, res) => {
    const result = updateRecipeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid recipe data", errors: result.error.errors });
    }
    const recipe = await storage.updateRecipe(req.params.id, result.data);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json(recipe);
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    const deleted = await storage.deleteRecipe(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(204).send();
  });

  return httpServer;
}
