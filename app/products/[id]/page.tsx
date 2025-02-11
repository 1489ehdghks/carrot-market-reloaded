import { notFound } from "next/navigation";
import db from "@/lib/db";
import getSession from "@/lib/session";
import Image from "next/image";
import { UserIcon } from "@heroicons/react/24/solid";
import { formatToWon } from "@/lib/utils";
import { redirect } from "next/navigation";
import { unstable_cache as nextCache,revalidateTag } from "next/cache";

async function getIsOwner(userId:number){
  const session = await getSession();
  if(session.id){
    return session.id === userId;
  }
  return false;
}

export async function getProduct(id: number) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          username: true,
          avatar: true,
        },
      },
    },
  });
  return product;
}

const getCachedProduct = nextCache(getProduct, ["product-detail"], {
  tags: ["product", "list"],
});

async function getProductTitle(id: number) {
  const product = await db.product.findUnique({
    where: {
      id,
    },
    select: {
      title: true,
    },
  });
  return product;
}

const getCachedProductTitle = nextCache(getProductTitle, ["product-title"], {
  tags: ["product-title", "xxxx"],
});

const deleteProduct = async (formData:FormData) => {
  "use server";
  const id = formData.get("id");
  await db.product.delete({
    where: { id: Number(id) },
  });
  revalidateTag('products');
  redirect("/home");
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetail({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (isNaN(productId)) {
    return notFound();
  }

  const product = await getCachedProduct(productId);
  if (!product) {
    return notFound();
  }

  const isOwner = await getIsOwner(product.userId);
  const revalidate = async () => {
    "use server";
    revalidateTag("products");
  };

  const createChatRoom = async () => {
    "use server";
    const session = await getSession();
    const room = await db.chatRoom.create({
      data: {
        users: { 
          connect:[
          {
            id: product.userId,
          },
          {
            id: session?.id,
          }
        ] },
      },
      select: {
        id: true,
      },
    });
    redirect(`/chats/${room.id}`);
  }

  return(
    <div className="pb-40">
      <div className="relative aspect-square">
        {product.photo && <Image fill src={`${product.photo}/public`} alt={product.title} />}
      </div>
      <div className="p-5 flex items-center gap-3 border-b border-neutral-700">
        <div className="size-10 rounded-full overflow-hidden">
          <UserIcon className="size-10 rounded-full"/>
          {product.user.avatar !== null ? <Image src={product.user.avatar} alt={product.user.username} width={40} height={40}/> : <UserIcon className="size-10 rounded-full"/>}
        </div>
        <div>
          <h3>{product.user.username}</h3>
        </div>
      </div>
      <div className="p-5">
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <p className="text-neutral-500">{product.description}</p>
      </div>
      <div className="fixed w-full bottom-0  p-5 pb-10 bg-neutral-800 flex justify-between items-center max-w-screen-sm">
        <span className="font-semibold text-lg">{formatToWon(product.price)}원</span>
        {isOwner ? (
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id}/>
            <button type="submit" className="bg-neutral-700 px-5 py-2.5 rounded-md text-white font-semibold">
              삭제
            </button>
            </form>
            
          ) : null}
          <form action={revalidate}>
          <button className="bg-red-500 px-5 py-2.5 rounded-md text-white font-semibold">
            Revalidate title cache
          </button>
        </form>
        <form action={createChatRoom}>
          <button className="bg-orange-500 px-5 py-2.5 rounded-md text-white font-semibold">채팅하기</button>

        </form>

      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `Product ${id}`,
  };
}

export const dynamicParams = true;
export async function gernerateStaticParams() {
  const products = await db.product.findMany({
    select: {
      id: true,
    },
  });
  return products.map((product) => ({
    id: product.id.toString(),
  }));
}