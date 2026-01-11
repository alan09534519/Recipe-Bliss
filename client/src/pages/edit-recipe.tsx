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
import { ArrowLeft, Plus, Trash2, Image, Save, Loader2, X, Link } from "lucide-react";
import { RECIPE_CATEGORIES, type Recipe } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

const MAX_IMAGES = 5;

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
  sourceUrls: z.array(z.object({
    value: z.string().url("請輸入有效的網址").or(z.literal(""))
  })),
});

type EditRecipeForm = z.infer<typeof editRecipeSchema>;

interface ImageItem {
  id: string;
  preview: string;
  objectPath: string | null;
  uploading: boolean;
  isExisting?: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function EditRecipe() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);

  const { uploadFile } = useUpload();

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
      sourceUrls: [{ value: "" }],
    },
  });

  useEffect(() => {
    if (recipe) {
      const existingSourceUrls = recipe.sourceUrls && recipe.sourceUrls.length > 0
        ? recipe.sourceUrls.map(url => ({ value: url }))
        : [{ value: "" }];
      
      form.reset({
        name: recipe.name,
        category: recipe.category || undefined,
        servings: recipe.servings || 2,
        cookTime: recipe.cookTime || "",
        ingredients: recipe.ingredients.map(i => ({ value: i })),
        steps: recipe.steps.map(s => ({ value: s })),
        sourceUrls: existingSourceUrls,
      });
      
      if (recipe.imageUrls && recipe.imageUrls.length > 0) {
        const existingImages: ImageItem[] = recipe.imageUrls.map((url, index) => ({
          id: `existing-${index}`,
          preview: url.startsWith('/objects/') ? url : `/objects/${url}`,
          objectPath: url,
          uploading: false,
          isExisting: true,
        }));
        setImages(existingImages);
      }
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

  const sourceUrlsArray = useFieldArray({
    control: form.control,
    name: "sourceUrls",
  });

  const isAnyImageUploading = images.some(img => img.uploading);

  const updateRecipeMutation = useMutation({
    mutationFn: async (data: EditRecipeForm) => {
      const imageUrls = images
        .filter(img => img.objectPath)
        .map(img => img.objectPath as string);
      
      const sourceUrls = data.sourceUrls
        .map(s => s.value.trim())
        .filter(s => s.length > 0);
      
      const payload = {
        name: data.name,
        category: data.category || null,
        servings: data.servings,
        cookTime: data.cookTime || null,
        ingredients: data.ingredients.map(i => i.value),
        steps: data.steps.map(s => s.value),
        imageUrls,
        sourceUrls,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: "已達上限",
        description: `最多只能上傳 ${MAX_IMAGES} 張圖片`,
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "檔案太大",
          description: `${file.name} 超過 10MB，已跳過`,
          variant: "destructive",
        });
        continue;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "檔案格式錯誤",
          description: `${file.name} 不是圖片檔案，已跳過`,
          variant: "destructive",
        });
        continue;
      }

      const imageId = generateId();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const newImage: ImageItem = {
          id: imageId,
          preview: reader.result as string,
          objectPath: null,
          uploading: true,
        };
        setImages(prev => [...prev, newImage]);
        
        uploadFile(file).then(response => {
          if (response) {
            setImages(prev => prev.map(img => 
              img.id === imageId 
                ? { ...img, objectPath: response.objectPath, uploading: false }
                : img
            ));
          } else {
            setImages(prev => prev.filter(img => img.id !== imageId));
            toast({
              title: "上傳失敗",
              description: `${file.name} 上傳失敗`,
              variant: "destructive",
            });
          }
        });
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
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
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">食譜照片</Label>
                  <span className="text-sm text-muted-foreground">{images.length}/{MAX_IMAGES}</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 pr-2">
                  {images.map((image, index) => (
                    <div 
                      key={image.id} 
                      className="relative aspect-square rounded-md border bg-muted"
                    >
                      <img 
                        src={image.preview} 
                        alt={`照片 ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      {image.uploading ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg z-10"
                          onClick={() => removeImage(image.id)}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {images.length < MAX_IMAGES && (
                    <label 
                      htmlFor="image-upload-edit"
                      className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover-elevate transition-colors text-muted-foreground"
                    >
                      <Image className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs">新增照片</span>
                      <input
                        id="image-upload-edit"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="sr-only"
                        onChange={handleImageUpload}
                        disabled={isAnyImageUploading}
                        data-testid="input-image-upload"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">支援 JPG、PNG、WebP，每張最大 10MB</p>
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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    食譜來源
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => sourceUrlsArray.append({ value: "" })}
                    data-testid="button-add-source-url"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    新增
                  </Button>
                </div>
                <div className="space-y-3">
                  {sourceUrlsArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`sourceUrls.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                type="url"
                                placeholder="例如：https://youtube.com/watch?v=..." 
                                {...field}
                                data-testid={`input-source-url-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {sourceUrlsArray.fields.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => sourceUrlsArray.remove(index)}
                          data-testid={`button-remove-source-url-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  可填入原始食譜的影片或網誌連結
                </p>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 border-t -mx-4 px-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={updateRecipeMutation.isPending || isAnyImageUploading}
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
