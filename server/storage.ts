import { type User, type InsertUser, type Recipe, type InsertRecipe } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private recipes: Map<string, Recipe>;

  constructor() {
    this.users = new Map();
    this.recipes = new Map();
    this.seedRecipes();
  }

  private seedRecipes() {
    const sampleRecipes: InsertRecipe[] = [
      {
        name: "番茄炒蛋",
        imageUrl: null,
        ingredients: ["雞蛋 3顆", "番茄 2顆", "蔥 1根", "鹽 適量", "糖 1小匙"],
        steps: [
          "雞蛋打散，加少許鹽調味。",
          "番茄切塊，蔥切成蔥花。",
          "熱鍋加油，倒入蛋液炒至半熟後盛出。",
          "另起油鍋，放入番茄翻炒出汁。",
          "加入糖和鹽調味，倒回炒蛋拌勻。",
          "撒上蔥花即可起鍋。"
        ],
        servings: 2,
        cookTime: "15 分鐘"
      },
      {
        name: "日式咖哩飯",
        imageUrl: null,
        ingredients: ["咖哩塊 1盒", "馬鈴薯 2顆", "紅蘿蔔 1根", "洋蔥 1顆", "豬肉片 200g", "白飯 2碗"],
        steps: [
          "馬鈴薯、紅蘿蔔切塊，洋蔥切絲。",
          "熱鍋加油，先炒香洋蔥至透明。",
          "加入豬肉片炒至變色。",
          "放入馬鈴薯和紅蘿蔔，加水蓋過食材。",
          "煮滾後轉小火燉煮20分鐘。",
          "關火加入咖哩塊攪拌至溶化。",
          "再次開小火煮5分鐘至濃稠。",
          "盛飯淋上咖哩即完成。"
        ],
        servings: 2,
        cookTime: "45 分鐘"
      },
      {
        name: "蒜香義大利麵",
        imageUrl: null,
        ingredients: ["義大利麵 200g", "蒜頭 5瓣", "辣椒 1根", "橄欖油 3大匙", "鹽 適量", "黑胡椒 適量", "巴西里 少許"],
        steps: [
          "大鍋水煮滾加鹽，放入義大利麵煮至彈牙。",
          "蒜頭切片，辣椒切圈。",
          "平底鍋加橄欖油，小火爆香蒜片至金黃。",
          "加入辣椒稍微拌炒。",
          "瀝乾麵條，加入鍋中拌勻。",
          "加鹽和黑胡椒調味。",
          "撒上巴西里即可享用。"
        ],
        servings: 2,
        cookTime: "20 分鐘"
      },
      {
        name: "味噌湯",
        imageUrl: null,
        ingredients: ["味噌 2大匙", "豆腐 半塊", "海帶芽 適量", "蔥 1根", "柴魚高湯 500ml"],
        steps: [
          "豆腐切小丁，蔥切蔥花。",
          "海帶芽用水泡開備用。",
          "柴魚高湯煮滾後轉小火。",
          "加入豆腐和海帶芽煮2分鐘。",
          "取少許湯汁將味噌調開。",
          "關火後加入味噌攪拌均勻。",
          "撒上蔥花即可上桌。"
        ],
        servings: 2,
        cookTime: "10 分鐘"
      },
      {
        name: "蜂蜜檸檬雞翅",
        imageUrl: null,
        ingredients: ["雞翅 8支", "蜂蜜 3大匙", "檸檬汁 2大匙", "醬油 2大匙", "蒜末 1大匙", "薑末 1小匙"],
        steps: [
          "雞翅洗淨擦乾，用刀劃幾道。",
          "混合蜂蜜、檸檬汁、醬油、蒜末和薑末成醃料。",
          "雞翅放入醃料中，冷藏醃製至少1小時。",
          "烤箱預熱200度。",
          "雞翅放在烤盤上，刷上醃料。",
          "烤25-30分鐘，中途翻面並刷醃料。",
          "烤至表面金黃焦糖化即完成。"
        ],
        servings: 2,
        cookTime: "40 分鐘"
      },
      {
        name: "麻婆豆腐",
        imageUrl: null,
        ingredients: ["板豆腐 1塊", "豬絞肉 100g", "豆瓣醬 1.5大匙", "蒜末 1大匙", "薑末 1小匙", "花椒粉 適量", "太白粉水 適量", "蔥花 少許"],
        steps: [
          "豆腐切成2公分小丁，用鹽水燙過瀝乾。",
          "熱鍋加油，炒香豬絞肉至變色。",
          "加入蒜末、薑末和豆瓣醬炒出紅油。",
          "加入適量水煮滾。",
          "放入豆腐輕輕拌勻，煮3分鐘。",
          "加入太白粉水勾芡。",
          "撒上花椒粉和蔥花即可。"
        ],
        servings: 2,
        cookTime: "20 分鐘"
      }
    ];

    sampleRecipes.forEach(recipe => {
      const id = randomUUID();
      this.recipes.set(id, { ...recipe, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const id = randomUUID();
    const recipe: Recipe = { ...insertRecipe, id };
    this.recipes.set(id, recipe);
    return recipe;
  }

  async updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const existing = this.recipes.get(id);
    if (!existing) return undefined;
    const updated: Recipe = { ...existing, ...updates };
    this.recipes.set(id, updated);
    return updated;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    return this.recipes.delete(id);
  }
}

export const storage = new MemStorage();
