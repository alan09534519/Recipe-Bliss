import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import type { Recipe } from "@shared/schema";

interface RecipeListItemProps {
  recipe: Recipe;
  onClick?: () => void;
}

export function RecipeListItem({ recipe, onClick }: RecipeListItemProps) {
  const imageUrls = recipe.imageUrls || [];
  
  const getThumbnailUrl = (url: string) => {
    const objectPath = url.startsWith('/objects/') ? url.slice(9) : url;
    return `/thumbnails/${objectPath}?w=80&h=80&q=70`;
  };
  
  const primaryImage = imageUrls.length > 0 ? getThumbnailUrl(imageUrls[0]) : null;

  return (
    <div 
      className="flex items-center gap-3 p-3 bg-card rounded-md border cursor-pointer hover-elevate active-elevate-2 transition-transform duration-200"
      onClick={onClick}
      data-testid={`list-item-recipe-${recipe.id}`}
    >
      <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={`${recipe.name} 的照片`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-muted-foreground opacity-50"
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
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 
          className="font-serif text-base font-semibold truncate"
          data-testid={`text-recipe-name-${recipe.id}`}
        >
          {recipe.name}
        </h3>
        <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
          {recipe.category && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {recipe.category}
            </Badge>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{recipe.servings} 人份</span>
            </div>
          )}
          {recipe.cookTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{recipe.cookTime}</span>
            </div>
          )}
        </div>
      </div>
      
      {imageUrls.length > 1 && (
        <div className="flex-shrink-0 text-xs text-muted-foreground">
          {imageUrls.length} 張
        </div>
      )}
    </div>
  );
}
