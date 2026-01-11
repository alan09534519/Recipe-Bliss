import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Image, Save, Loader2 } from "lucide-react";
import { RECIPE_CATEGORIES, type Recipe } from "@shared/schema";

const editRecipeSchema = z.object({
  name: z.string().min(1, "請輸入菜名"),
  category: z.string().optional(),
  servings: z.coerce.number().min(1, "至少1人份").max(20, "最多20人份"),
  cookTime: z.string().optional(),
  ingredients: z.array(z.object({
    value: z.string().min(1, "請輸入食材")
  })).min(1, "請至少輸入一個食材"),
  steps: z.array(z.object({
    value: z.string().min(1, "請輸入步驟")
  })).min(1, "請至少輸入一個步驟"),
});

type EditRecipeForm = z.infer<typeof editRecipeSchema>;

export default function EditRecipe() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: recipe, isLoading, error } = useQuery<Recipe>({
    queryKey: ["/api/recipes", params.id],
    enabled: !!params.id,
  });

  const form = useForm<EditRecipeForm>({
    resolver: zodResolver(editRecipeSchema),
    defaultValues: {
      name: "",
      category: undefined,
      servings: 2,
      cookTime: "",
      ingredients: [{ value: "" }],
      steps: [{ value: "" }],
    },
  });

  useEffect(() => {
    if (recipe) {
      form.reset({
        name: recipe.name,
        category: recipe.category || undefined,
        servings: recipe.servings || 2,
        cookTime: recipe.cookTime || "",
        ingredients: recipe.ingredients.map(i => ({ value: i })),
        steps: recipe.steps.map(s => ({ value: s })),
      });
      setImagePreview(recipe.imageUrl || null);
    }
  }, [recipe, form]);

  const ingredientsArray = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const stepsArray = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const updateRecipeMutation = useMutation({
    mutationFn: async (data: EditRecipeForm) => {
      const payload = {
        name: data.name,
        category: data.category || null,
        servings: data.servings,
        cookTime: data.cookTime || null,
        ingredients: data.ingredients.map(i => i.value),
        steps: data.steps.map(s => s.value),
        imageUrl: imagePreview,
      };
      const response = await apiRequest("PATCH", `/api/recipes/${params.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", params.id] });
      toast({
        title: "成功！",
        description: "食譜已成功更新",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "更新食譜時發生錯誤，請稍後再試",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "檔案太大",
        description: "請選擇小於 5MB 的圖片",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "檔案格式錯誤",
        description: "請選擇圖片檔案（JPG、PNG、WebP）",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      toast({
        title: "讀取失敗",
        description: "無法讀取圖片，請重試",
        variant: "destructive",
      });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: EditRecipeForm) => {
    updateRecipeMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">找不到這個食譜</p>
        <Button onClick={() => setLocation("/")} data-testid="button-back-home">
          返回首頁
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-bold">編輯食譜</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Label htmlFor="image-upload-edit" className="text-base font-semibold mb-4 block">食譜照片</Label>
                <label 
                  htmlFor="image-upload-edit"
                  className="block border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover-elevate transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      document.getElementById("image-upload-edit")?.click();
                    }
                  }}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="預覽" 
                        className="max-h-64 mx-auto rounded-md object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setImagePreview(null);
                        }}
                        data-testid="button-remove-image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">點擊或按 Enter 上傳照片</p>
                      <p className="text-xs mt-1">支援 JPG、PNG，最大 5MB</p>
                    </div>
                  )}
                  <input
                    id="image-upload-edit"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleImageUpload}
                    data-testid="input-image-upload"
                  />
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>菜名 *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="例如：番茄炒蛋" 
                          {...field}
                          data-testid="input-recipe-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>分類</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="選擇分類" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RECIPE_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>人份數 *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={20}
                            {...field}
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-servings"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="cookTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>烹飪時間</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="例如：30 分鐘" 
                          {...field}
                          data-testid="input-cook-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">食材清單 *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => ingredientsArray.append({ value: "" })}
                    data-testid="button-add-ingredient"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    新增食材
                  </Button>
                </div>
                <div className="space-y-3">
                  {ingredientsArray.fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`ingredients.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder={`食材 ${index + 1}（例如：雞蛋 2顆）`}
                                {...field}
                                data-testid={`input-ingredient-${index}`}
                              />
                            </FormControl>
                            {ingredientsArray.fields.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => ingredientsArray.remove(index)}
                                data-testid={`button-remove-ingredient-${index}`}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">烹飪步驟 *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => stepsArray.append({ value: "" })}
                    data-testid="button-add-step"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    新增步驟
                  </Button>
                </div>
                <div className="space-y-4">
                  {stepsArray.fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`steps.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <FormControl>
                              <Textarea 
                                placeholder={`步驟 ${index + 1} 的說明...`}
                                className="min-h-[80px] resize-none"
                                {...field}
                                data-testid={`input-step-${index}`}
                              />
                            </FormControl>
                            {stepsArray.fields.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => stepsArray.remove(index)}
                                data-testid={`button-remove-step-${index}`}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 border-t -mx-4 px-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={updateRecipeMutation.isPending}
                data-testid="button-save-recipe"
              >
                {updateRecipeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    儲存變更
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
