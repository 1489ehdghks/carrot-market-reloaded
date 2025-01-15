import { notFound } from "next/navigation";
import db from "@/lib/db";
import getSession from "@/lib/session";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "@heroicons/react/24/solid";
import { formatToWon } from "@/lib/utils";
import { redirect } from "next/navigation";

async function getIsOwner(userId:number){
  const session = await getSession();
  if(session.id){
    return session.id === userId;
  }
  return false;
}

async function getProduct(id:number) {
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
  console.log(product);
  return product;
  }

  const deleteProduct = async (formData:FormData) => {
    "use server";
    const id = formData.get("id");
    await db.product.delete({
      where: { id: Number(id) },
    });
    redirect("/products");
  }

  export default async function ProductDetail({params}: {params: { id: string };})
  {
    const id = Number(params.id);
    if (isNaN(id)) {
        return notFound();
    }
    const product = await getProduct(id);
    if(!product){
        return notFound();
    }
    const isOwner = await getIsOwner(product.userId);
    return(
      <div>
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
        <div className="fixed w-full bottom-0 left-0 bg-neutral-800 p-5 flex justify-between items-center">
          <span className="font-semibold text-lg">{formatToWon(product.price)}원</span>
          {isOwner ? (
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id}/>
              <button type="submit" className="bg-neutral-700 px-5 py-2.5 rounded-md text-white font-semibold">
                삭제
              </button>
              </form>
            ) : null}
          <Link className="bg-orange-500 px-5 py-2.5 rounded-md text-white font-semibold" href={`/chat/${product.user.username}`}>채팅하기</Link>

        </div>
      </div>
    );
  }