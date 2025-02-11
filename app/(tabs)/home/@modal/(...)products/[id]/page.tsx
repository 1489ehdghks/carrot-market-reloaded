import { PhotoIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";
import CloseButton from "./closeButton";
import EditButton from "./editButton";
import Image from "next/image";
import { formatToWon } from "@/lib/utils";
import { getProduct } from "@/app/products/[id]/page";
import { Metadata } from 'next';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function Page({ params }: PageProps) {
    const { id } = params;
    if (id === 'add') {
        return null;
    }
    
    const productId = Number(id);
    if(isNaN(productId)) {
        return notFound();
    }

    const product = await getProduct(productId);
    if (!product) {
        return notFound();
    }

    return (
        <dialog className="fixed inset-0 bg-transparent z-50" open>
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-xl relative">
                    <div className="relative">
                        <div className="absolute right-0 top-0 p-4 flex gap-2 z-10">
                            <EditButton productId={product.id} />
                            <CloseButton />
                        </div>

                    
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* 이미지 섹션 */}
                            <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800">
                                {product.photo ? (
                                    <Image 
                                        src={`${product.photo}/public`}
                                        alt={product.title}
                                        fill
                                        priority
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PhotoIcon className="h-24 w-24 text-neutral-400" />
                                    </div>
                                )}
                            </div>

                            {/* 콘텐츠 섹션 */}
                            <div className="p-6 md:p-8 flex flex-col h-full">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-semibold mb-2">
                                        {product.title}
                                    </h2>
                                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                                        {product.description}
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-neutral-500">가격:</span>
                                            <span className="font-semibold">₩{formatToWon(product.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {product.user.avatar ? (
                                                <Image 
                                                    src={product.user.avatar} 
                                                    alt={product.user.username}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-neutral-200" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {product.user.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            
                                {/* 하단 버튼 */}
                                <div className="mt-6 flex gap-3">
                                    <button className="flex-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 py-2.5 rounded-lg font-medium transition-colors">
                                        찜하기
                                    </button>
                                    <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-medium transition-colors">
                                        구매하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </dialog>
    );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Product ${params.id}`,
  };
}