import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Clock, Users, Pencil } from "lucide-react";
import type { Recipe } from "@shared/schema";
import { useState } from "react";
import { useLocation } from "wouter";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeDetail({ recipe, onBack }: RecipeDetailProps) {
  const [, setLocation] = useLocation();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {recipe.imageUrl ? (
          <div className="h-64 md:h-96 w-full overflow-hidden">
            <img
              src={recipe.imageUrl}
              alt={`${recipe.name} 的照片`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-64 md:h-96 w-full bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <svg
                className="w-20 h-20 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-lg">食譜照片</span>
            </div>
          </div>
        )}
        
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setLocation(`/edit/${recipe.id}`)}
          data-testid="button-edit-recipe"
        >
          <Pencil className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="py-6">
          <h1 
            className="font-serif text-3xl md:text-4xl font-bold mb-4"
            data-testid="text-recipe-title"
          >
            {recipe.name}
          </h1>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            {recipe.servings && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span data-testid="text-detail-servings">{recipe.servings} 人份</span>
              </div>
            )}
            {recipe.cookTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span data-testid="text-detail-cooktime">{recipe.cookTime}</span>
              </div>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">食材清單</h2>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Checkbox
                    id={`ingredient-${index}`}
                    checked={checkedIngredients.has(index)}
                    onCheckedChange={() => toggleIngredient(index)}
                    data-testid={`checkbox-ingredient-${index}`}
                  />
                  <label
                    htmlFor={`ingredient-${index}`}
                    className={`flex-1 cursor-pointer transition-all ${
                      checkedIngredients.has(index)
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                    data-testid={`text-ingredient-${index}`}
                  >
                    {ingredient}
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">烹飪步驟</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <p 
                  className="flex-1 leading-relaxed pt-1"
                  data-testid={`text-step-${index}`}
                >
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
