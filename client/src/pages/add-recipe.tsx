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
import { ArrowLeft, Plus, Trash2, GripVertical, Image, Loader2 } from "lucide-react";
import { RECIPE_CATEGORIES } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

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
});

type AddRecipeForm = z.infer<typeof addRecipeSchema>;

export default function AddRecipe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageObjectPath, setImageObjectPath] = useState<string | null>(null);
  
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setImageObjectPath(response.objectPath);
      toast({
        title: "上傳成功",
        description: "圖片已成功上傳",
      });
    },
    onError: (error) => {
      toast({
        title: "上傳失敗",
        description: error.message || "圖片上傳失敗，請稍後再試",
        variant: "destructive",
      });
      setImagePreview(null);
    },
  });

  const form = useForm<AddRecipeForm>({
    resolver: zodResolver(addRecipeSchema),
    defaultValues: {
      name: "",
      category: undefined,
      servings: 2,
      cookTime: "",
      ingredients: [{ value: "" }],
      steps: [{ value: "" }],
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

  const createRecipeMutation = useMutation({
    mutationFn: async (data: AddRecipeForm) => {
      const payload = {
        name: data.name,
        category: data.category || null,
        servings: data.servings,
        cookTime: data.cookTime || null,
        ingredients: data.ingredients.map(i => i.value),
        steps: data.steps.map(s => s.value),
        imageUrl: imageObjectPath,
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
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "檔案太大",
        description: "請選擇小於 10MB 的圖片",
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
    reader.readAsDataURL(file);

    await uploadFile(file);
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
                <Label htmlFor="image-upload" className="text-base font-semibold mb-4 block">食譜照片</Label>
                <label 
                  htmlFor="image-upload"
                  className="block border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover-elevate transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      document.getElementById("image-upload")?.click();
                    }
                  }}
                >
                  {isUploading ? (
                    <div className="text-muted-foreground">
                      <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin" />
                      <p className="text-sm">上傳中...</p>
                    </div>
                  ) : imagePreview ? (
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
                          setImageObjectPath(null);
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
                      <p className="text-xs mt-1">支援 JPG、PNG、WebP，最大 10MB</p>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleImageUpload}
                    disabled={isUploading}
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

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={createRecipeMutation.isPending || isUploading}
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
