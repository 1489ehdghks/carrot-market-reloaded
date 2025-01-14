"use client"

import { HomeIcon as HomeIconOutline, NewspaperIcon as NewspaperIconOutline,ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconOutline, ShoppingBagIcon as ShoppingBagIconOutline, UserIcon as UserIconOutline } from "@heroicons/react/24/outline"
import { HomeIcon as HomeIconSolid, NewspaperIcon as NewspaperIconSolid,ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid, ShoppingBagIcon as ShoppingBagIconSolid, UserIcon as UserIconSolid } from "@heroicons/react/24/solid"


import Link from "next/link"
import { usePathname } from "next/navigation";

export default function TabBar(){
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 w-full mx-auto max-w-screen-md grid grid-cols-5 border-neutral-600 border-t px-5 py-3 *:text-white bg-neutral-800">
            <Link href="/products" className="flex flex-col items-center gap-px">
                {pathname === "/products" ? 
                <HomeIconSolid className="w-7 h-7"/> : 
                <HomeIconOutline className="w-7 h-7"/>}
                <span>홈</span>
            </Link>
            <Link href="/life" className="flex flex-col items-center gap-px">
            {pathname === "/life" ? 
                (<NewspaperIconSolid className="w-7 h-7"/>) : 
                (<NewspaperIconOutline className="w-7 h-7"/>)}
                <span>동네생활</span>
            </Link>
            <Link href="/chats" className="flex flex-col items-center gap-px">
            {pathname === "/chats" ? 
                <ChatBubbleLeftRightIconSolid className="w-7 h-7"/> : 
                <ChatBubbleLeftRightIconOutline className="w-7 h-7"/>}
                <span>채팅</span>
            </Link>
            <Link href="/live" className="flex flex-col items-center gap-px">
            {pathname === "/live" ? 
                <ShoppingBagIconSolid className="w-7 h-7"/> : 
                <ShoppingBagIconOutline className="w-7 h-7"/>}
                <span>쇼핑</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center gap-px">
            {pathname === "/profile" ? 
                <UserIconSolid className="w-7 h-7"/> : 
                <UserIconOutline className="w-7 h-7"/>}
                <span>프로필</span>
            </Link>
        </div>
    )
}