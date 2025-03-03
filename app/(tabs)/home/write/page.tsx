"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createPost, checkAdmin } from "../actions";
import Editor from "./components/Editor";
import { useEffect, useState } from "react";
import PostFilter from "../components/PostFilter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const writeFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
  type: z.enum(["general", "notice", "question", "info", "resource"] as const),
  category: z.enum(["general", "2d", "2.5d", "realistic", "other"] as const),
  isAdult: z.boolean().default(false)
});

type WriteFormData = z.infer<typeof writeFormSchema>;

export default function WritePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<WriteFormData>({
    resolver: zodResolver(writeFormSchema),
    defaultValues: {
      type: "general",
      category: "general",
      isAdult: false
    }
  });

  useEffect(() => {
    checkAdmin().then(setIsAdmin);
  }, []);

  const onSubmit = async (data: WriteFormData) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      await createPost(formData);
      router.push("/home");
    } catch (error) {
      console.error("글 작성 중 오류 발생:", error);
      alert("글 작성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="space-y-6 bg-neutral-900 p-6 rounded-lg">
        <div className="space-y-2">
          <input
            {...register("title")}
            placeholder="제목을 입력하세요"
            className="w-full text-2xl font-bold bg-transparent border border-neutral-700 rounded-lg p-4 outline-none focus:border-orange-500 transition-colors"
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-4 border-y border-neutral-800 py-4">
          <PostFilter
            type={watch("type")}
            onTypeChange={(type) => setValue("type", type || "general")}
            category={watch("category")}
            onCategoryChange={(category) => setValue("category", category || "general")}
            showAdult={watch("isAdult")}
            onShowAdultChange={(isAdult) => setValue("isAdult", isAdult)}
            isAdmin={isAdmin}
            mode="write"
          />
        </div>

        <div>
          <Editor
            onChange={(content) => setValue("content", content)}
            content={watch("content")}
            placeholder="내용을 입력하세요..."
          />
          {errors.content && (
            <p className="text-sm text-red-500 mt-2">{errors.content.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors"
        >
          작성
        </button>
      </div>
    </form>
  );
} 