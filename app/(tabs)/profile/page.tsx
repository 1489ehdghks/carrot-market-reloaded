import getSession from "@/lib/session";
import db from "@/lib/db";
import { redirect,notFound } from "next/navigation";
import { Suspense } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { CameraIcon } from "@heroicons/react/24/solid";
import Image from "next/image";


async function getUser(){
    const session = await getSession();
    if(session.id){
        const user = await db.user.findUnique({
            where:{id:session.id}
        });
        if(user){
            return user;
        }
    }
    //notfound 페이지로 보냄
    notFound();
}

async function Username(){
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = await getUser();
    return <h1>Welcome! {user?.username}!</h1>
}


export default async function ProfilePage(){
    const user = await getUser();
    const logout = async () => {
        'use server';
        const session = await getSession();
        await session.destroy();
        redirect('/');
    }
    return (
    <div className='p-5 max-w-xl mx-auto'>
        <Suspense fallback={<div>'Hello!'</div>}>
            <Username />
        </Suspense>
        
    {/* 프로필 헤더 */}
    <div className='flex flex-col items-center gap-5 mb-8'>
        <div className='relative'>

                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt="Profile"   
                            width={120}
                            height={120}
                            className="rounded-full"
                        />
                    ) : (
                        <UserCircleIcon className="w-32 h-32 text-neutral-600" />
                    )}
                    <button className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full text-white hover:bg-orange-600 transition-colors">
                        <CameraIcon className="w-5 h-5" />
                    </button>
                </div>
                <Suspense fallback={<div className="animate-pulse bg-neutral-700 h-8 w-32 rounded-lg" />}>
                    <Username />
                </Suspense>
            </div>

            {/* 프로필 정보 */}
            <div className="space-y-6">
                {/* 통계 */}
                <div className="grid grid-cols-3 gap-4 bg-neutral-800 p-4 rounded-xl">
                    <div className="text-center">
                        {/* <div className="text-2xl font-bold">{user.products?.length || 0}</div> */}
                        <div className="text-sm text-neutral-400">판매상품</div>
                    </div>
                    <div className="text-center border-x border-neutral-700">
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-sm text-neutral-400">팔로워</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-sm text-neutral-400">팔로잉</div>
                    </div>
                </div>

                {/* 메뉴 버튼들 */}
                <div className="space-y-2">
                    <button className="w-full bg-neutral-800 p-4 rounded-xl text-left hover:bg-neutral-700 transition-colors">
                        내 거래내역
                    </button>
                    <button className="w-full bg-neutral-800 p-4 rounded-xl text-left hover:bg-neutral-700 transition-colors">
                        관심목록
                    </button>
                    <button className="w-full bg-neutral-800 p-4 rounded-xl text-left hover:bg-neutral-700 transition-colors">
                        설정
                    </button>
                </div>

                {/* 로그아웃 버튼 */}
                <form action={logout}>
                    <button className="w-full bg-red-500 text-white p-4 rounded-xl hover:bg-red-600 transition-colors font-medium">
                        로그아웃
                    </button>
                </form>
            </div>
        </div>
);
}

