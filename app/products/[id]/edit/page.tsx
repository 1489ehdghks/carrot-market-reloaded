"use client"

import { useState, useEffect, use } from "react";
import Input from "@/components/input";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Button from "@/components/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { productSchema,ProductType } from "../../add/schema";
import { getUploadUrl } from "../../add/actions";
import { updateProduct, getProduct } from "./action";

interface EditProductProps {
  params: Promise<{
    id: string;
  }>
}

export default function EditProduct({ params }: EditProductProps) {
  const { id } = use(params);
  const router = useRouter();
  const [preview, setPreview] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const {register, handleSubmit, formState:{errors}, setValue, reset} = useForm<ProductType>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    const loadProduct = async () => {
      const product = await getProduct(id);
      if (product) {
        setValue("title", product.title);
        setValue("price", product.price);
        setValue("description", product.description);
        setValue("photo", product.photo);
        setPreview(`${product.photo}/public`);
      }
    };
    loadProduct();
  }, [id, setValue]);

  const onCancel = () => {
    router.back();
  };

  const onImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files?.length) return;
    
    const file = files[0];
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFile(file);
    
    const { success, result } = await getUploadUrl();
    if (success) {
      const { id, uploadURL } = result;
      setUploadUrl(uploadURL);
      setValue("photo", `https://imagedelivery.net/qFmkldEesZWwLcDQ2Xdj7w/${id}`);
    }
  };

  const onSubmit = handleSubmit(async (data: ProductType) => {
    try {
      if (file) {
        const cloudflareForm = new FormData();
        cloudflareForm.append("file", file);
        const response = await fetch(uploadUrl, {
          method: "post",
          body: cloudflareForm,
        });
        
        if (response.status !== 200) {
          reset(data);
          return;
        }
      }

      const formData = new FormData();
      formData.append("photo", data.photo);
      formData.append("title", data.title);
      formData.append("price", data.price+"");
      formData.append("description", data.description);
      
      const errors = await updateProduct(id, formData);
      if(errors) {
        reset(data);
        return;
      }
      
      router.push('/home');
    } catch (error) {
      reset(data);
    }
  });

  return (
    <div className="p-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <label
          htmlFor="photo"
          className="relative block border-2 border-gray-700 aspect-square rounded-xl overflow-hidden
            group-hover:border-violet-500 transition-all duration-300
            bg-gradient-to-br from-gray-800 to-gray-900"
          style={{
            backgroundImage: preview ? `url(${preview})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!preview && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <PhotoIcon className="w-16 h-16 text-gray-500 group-hover:text-violet-400 transition-colors" />
              <p className="mt-4 text-sm font-medium text-gray-400 group-hover:text-violet-400">
                클릭하여 사진 수정
              </p>
            </div>
          )}
        </label>
        <input
          onChange={onImageChange}
          type="file"
          id="photo"
          accept="image/*"
          className="hidden"
        />
        <Input
          required
          placeholder="제목"
          type="text"
          {...register("title")}
          errors={[errors.title?.message ?? ""]}
        />
        <Input
          type="number"
          required
          placeholder="가격"
          {...register("price")}
          errors={[errors.price?.message ?? ""]}
        />
        <Input
          type="text"
          required
          placeholder="자세한 설명"
          {...register("description")}
          errors={[errors.description?.message ?? ""]}
        />
        <div className="flex flex-col gap-2">
          <Button text="수정 완료" />
          <Button 
            text="취소" 
            variant="destructive"
            onClick={onCancel}
          />
        </div>
      </form>
    </div>
  );
}