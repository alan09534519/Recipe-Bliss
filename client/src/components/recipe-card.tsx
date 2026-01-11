import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import type { Recipe } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <Card 
      className="overflow-visible cursor-pointer hover-elevate active-elevate-2 transition-transform duration-200"
      onClick={onClick}
      data-testid={`card-recipe-${recipe.id}`}
    >
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-md">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={`${recipe.name} 的照片`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
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
                <span className="text-sm">食譜照片</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 
          className="font-serif text-xl font-bold mb-3 line-clamp-2"
          data-testid={`text-recipe-name-${recipe.id}`}
        >
          {recipe.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {recipe.servings && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span data-testid={`text-servings-${recipe.id}`}>{recipe.servings} 人份</span>
            </div>
          )}
          {recipe.cookTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span data-testid={`text-cooktime-${recipe.id}`}>{recipe.cookTime}</span>
            </div>
          )}
        </div>
        {recipe.ingredients.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.ingredients.slice(0, 3).map((ingredient, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-xs"
                data-testid={`badge-ingredient-${recipe.id}-${idx}`}
              >
                {ingredient.split(' ')[0]}
              </Badge>
            ))}
            {recipe.ingredients.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.ingredients.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
