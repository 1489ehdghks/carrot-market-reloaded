"use client"
import { useState } from "react";
import Input from "@/components/input";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Button from "@/components/button";
import { uploadProduct, getUploadUrl } from "./actions";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductType } from "./schema";

export default function AddProduct() {
    const [preview, setPreview] = useState("");
    const [uploadUrl, setUploadUrl] = useState("");
    const [photoId, setImageId] = useState("");
    const {register, handleSubmit} = useForm<ProductType>({
      resolver: zodResolver(productSchema),
    })
    const onImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const {
          target: { files },
        } = event;
        if (!files) {
          return;
        }
        const file = files[0];
        const url = URL.createObjectURL(file);
        setPreview(url);
        const { success, result } = await getUploadUrl();
        if (success) {
          const { id, uploadURL } = result;
          setUploadUrl(uploadURL);
          setImageId(id);
        }
      };
      const interceptAction = async (_: any, formData: FormData) => {
        const file = formData.get("photo");
        if (!file) {
          return;
        }
        const cloudflareForm = new FormData();
        cloudflareForm.append("file", file);
        const response = await fetch(uploadUrl, {
          method: "post",
          body: cloudflareForm,
        });
        console.log(await response.text());
        if (response.status !== 200) {
          return;
        }
        const photoUrl = `https://imagedelivery.net/qFmkldEesZWwLcDQ2Xdj7w/${photoId}`;
        formData.set("photo", photoUrl);
        return uploadProduct(_, formData);
      };
      const [state, action] = useActionState(interceptAction, null);

    return (
    <div>
       <form action={action} className="p-5 flex flex-col gap-5">
        <label
          htmlFor="photo"
          className="border-2 aspect-square flex items-center justify-center flex-col text-neutral-300 border-neutral-300 rounded-md border-dashed cursor-pointer bg-center bg-cover"
          style={{
            backgroundImage: `url(${preview})`,
          }}
        >
          {preview === "" ? (
            <>
              <PhotoIcon className="w-20" />
              <div className="text-neutral-400 text-sm">
                사진을 추가해주세요.
                {state?.fieldErrors.photo}
              </div>
            </>
          ) : null}
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
          errors={state?.fieldErrors.title}
        />
        <Input
          type="number"
          required
          placeholder="가격"
          {...register("price")}
          errors={state?.fieldErrors.price}
        />
        <Input
          type="text"
          required
          placeholder="자세한 설명"
          {...register("description")}
          errors={state?.fieldErrors.description}
        />
        <Button text="작성 완료" />
      </form>
    </div>
  );
}