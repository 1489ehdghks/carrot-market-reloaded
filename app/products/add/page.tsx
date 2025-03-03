"use client"
import { useState } from "react";
import Input from "@/components/input";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { uploadProduct, getUploadUrl } from "./actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { productSchema, ProductType } from "./schema";
import FormBtn from "@/components/button";

export default function AddProduct() {
    const router = useRouter();
    const [preview, setPreview] = useState("");
    const [uploadUrl, setUploadUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const {register, handleSubmit, formState:{errors},setValue,reset} = useForm<ProductType>({
      resolver: zodResolver(productSchema),
    })
    const onCancel = async () => {
      router.push('/home');
    };
    const onImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const {
          target: { files },
        } = event;
        if (!files) { return; }
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
        if (!file) {
          return;
        }
        try {
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

        const formData = new FormData();
        formData.append("photo", data.photo);
        formData.append("title", data.title);
        formData.append("price", data.price+"");
        formData.append("description", data.description);
        const errors = await uploadProduct(formData);
        if(errors){
          reset(data);
          return;
        }
        if (!errors) {
          router.push('/home');
      } 
    }catch {
      reset(data);
      }

      });
    const onValid = async () => {
      await onSubmit();
    }

    return (
    <div className="pb-20">
       <form action={onValid} className="p-5 flex flex-col gap-5">
        
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
                클릭하여 사진 추가
              </p>
              {errors.photo?.message && (
                <p className="mt-2 text-xs text-red-400">{errors.photo.message}</p>
              )}
            </div>
          )}
        </label>
        <input
          onChange={onImageChange}
          type="file"
          id="photo"
          name="photo"
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
      </form>

      <div className="fixed bottom-0 left-0 right-0 max-w-screen-sm mx-auto p-5 bg-neutral-900 border-t border-neutral-800">
        <div className="flex gap-3">
          <FormBtn text="작성 완료" onClick={onValid} />
          <FormBtn text="취소" variant="secondary" onClick={onCancel} />
        </div>
      </div>
    </div>
  );
}