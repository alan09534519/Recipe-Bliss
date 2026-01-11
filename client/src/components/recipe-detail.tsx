import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Clock, Users, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { Recipe } from "@shared/schema";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeDetail({ recipe, onBack }: RecipeDetailProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const imageUrls = recipe.imageUrls || [];
  const hasImages = imageUrls.length > 0;
  const hasMultipleImages = imageUrls.length > 1;
  const minSwipeDistance = 50;

  const deleteRecipeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/recipes/${recipe.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "刪除成功",
        description: `「${recipe.name}」已被刪除`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "刪除失敗",
        description: error.message || "無法刪除食譜，請稍後再試",
        variant: "destructive",
      });
    },
  });

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const getCurrentImageUrl = () => {
    if (!hasImages) return null;
    const url = imageUrls[currentImageIndex];
    return url.startsWith('/objects/') ? url : `/objects/${url}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isSwipeLeft = distance > minSwipeDistance;
    const isSwipeRight = distance < -minSwipeDistance;
    
    if (isSwipeLeft && hasMultipleImages) {
      goToNextImage();
    } else if (isSwipeRight && hasMultipleImages) {
      goToPreviousImage();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {hasImages ? (
          <div 
            className="h-64 md:h-96 w-full overflow-hidden relative touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={getCurrentImageUrl() || ""}
              alt={`${recipe.name} 的照片 ${currentImageIndex + 1}`}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
            
            {hasMultipleImages && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={goToPreviousImage}
                  data-testid="button-prev-image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={goToNextImage}
                  data-testid="button-next-image"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {imageUrls.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                      data-testid={`button-image-dot-${index}`}
                    />
                  ))}
                </div>
              </>
            )}
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
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="bg-background/80 backdrop-blur-sm"
            onClick={() => setLocation(`/edit/${recipe.id}`)}
            data-testid="button-edit-recipe"
          >
            <Pencil className="w-5 h-5" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                data-testid="button-delete-recipe"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確定要刪除這道食譜嗎？</AlertDialogTitle>
                <AlertDialogDescription>
                  這個動作無法復原。刪除後，「{recipe.name}」將會永久從您的食譜庫中移除。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteRecipeMutation.mutate()}
                  disabled={deleteRecipeMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  {deleteRecipeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      刪除中...
                    </>
                  ) : (
                    "確定刪除"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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

        <div className="space-y-6 mb-6">
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

        {recipe.sourceUrl && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-3">食譜來源</h2>
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline break-all"
                data-testid="link-source-url"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{recipe.sourceUrl}</span>
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
