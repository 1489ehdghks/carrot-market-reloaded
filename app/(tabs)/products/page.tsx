import ProductList from "@/components/product-list";
import {db} from "@/lib/db";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Prisma } from "@prisma/client";
import { unstable_cache as nextCache } from "next/cache";
import { redirect } from "next/navigation";

//WE NEED CACHE, nextjs 14.0 이상의 캐시
//revalidate는 캐시가 만료되는 시간을 설정함
//revalidate:60은 이 함수가 호출된 후 60초가 지나지 않은 경우,nextjs는 cache 안에 있는 데이터를 반환함
//절대 매 60초마다 작동하는것이 아님. 예시) 2주만에 사이트를 들어갔음. 60초가 지났으니 1번 다시 호출함.
//revalidate:false는 캐시가 만료되지 않음
//revalidate:60은 60초 후에 캐시가 만료됨
//revalidate:0은 캐시가 만료되지 않음
//revalidate:false는 캐시가 만료되지 않음
const getCacheProducts = nextCache(
  getInitialProducts,
  ['products'],
  {
    tags: ['products'],
  }
);

async function getInitialProducts() {
  const products = await db.product.findMany({
    select: {
      title: true,
      price: true,
      created_at: true,
      photo: true,
      id: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
  return products;
}

export type InitialProducts = Prisma.PromiseReturnType<
  typeof getInitialProducts
>;

export const metadata = {
  title: "Home",
};

export const dynamic = "auto";

async function navigateToAdd() {
  'use server'
  redirect('/products/add')
}

export default async function Products() {
  const initialProducts = await getCacheProducts();
  // const revalidate = async () =>{
  //   "use server";
  //   revalidatePath('/home')
  // }

  return (
    <div>
      <ProductList initialProducts={initialProducts} />
      <form action={navigateToAdd}>
        <button 
          type="submit"
          className="bg-orange-500 flex items-center justify-center rounded-full size-16 fixed bottom-24 right-8 text-white transition-colors hover:bg-orange-400"
        >
          <PlusIcon className="size-10" />
        </button>
      </form>
    </div>
  );
}