import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
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
import { ArrowLeft, Plus, Trash2, GripVertical, Image, Loader2, X, Link } from "lucide-react";
import { RECIPE_CATEGORIES } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

const MAX_IMAGES = 5;

const addRecipeSchema = z.object({
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

type AddRecipeForm = z.infer<typeof addRecipeSchema>;

interface ImageItem {
  id: string;
  preview: string;
  objectPath: string | null;
  uploading: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function AddRecipe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);
  
  const { uploadFile } = useUpload();

  const form = useForm<AddRecipeForm>({
    resolver: zodResolver(addRecipeSchema),
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

  const createRecipeMutation = useMutation({
    mutationFn: async (data: AddRecipeForm) => {
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
      const response = await apiRequest("POST", "/api/recipes", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "成功！",
        description: "食譜已成功新增",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "新增食譜時發生錯誤，請稍後再試",
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

  const onSubmit = (data: AddRecipeForm) => {
    createRecipeMutation.mutate(data);
  };

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
            <h1 className="font-serif text-xl font-bold">新增食譜</h1>
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
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div 
                      key={image.id} 
                      className="relative aspect-square rounded-md overflow-hidden border bg-muted"
                    >
                      <img 
                        src={image.preview} 
                        alt={`照片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {image.uploading ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute top-1 right-1 h-7 w-7"
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
                      htmlFor="image-upload"
                      className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover-elevate transition-colors text-muted-foreground"
                    >
                      <Image className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs">新增照片</span>
                      <input
                        id="image-upload"
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
                          defaultValue={field.value}
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
                          data-testid="input-cooktime"
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
                    新增
                  </Button>
                </div>
                <div className="space-y-3">
                  {ingredientsArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <FormField
                        control={form.control}
                        name={`ingredients.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder="例如：雞蛋 3顆" 
                                {...field}
                                data-testid={`input-ingredient-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    新增
                  </Button>
                </div>
                <div className="space-y-4">
                  {stepsArray.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`steps.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="描述這個步驟..." 
                                  className="min-h-20 resize-none"
                                  {...field}
                                  data-testid={`input-step-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {stepsArray.fields.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => stepsArray.remove(index)}
                          className="flex-shrink-0"
                          data-testid={`button-remove-step-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
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

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={createRecipeMutation.isPending || isAnyImageUploading}
              data-testid="button-submit-recipe"
            >
              {createRecipeMutation.isPending ? "儲存中..." : "儲存食譜"}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
