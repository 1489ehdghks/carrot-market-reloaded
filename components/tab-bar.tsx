"use client"

import { HomeIcon as HomeIconOutline, NewspaperIcon as NewspaperIconOutline,ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconOutline, ShoppingBagIcon as ShoppingBagIconOutline, UserIcon as UserIconOutline } from "@heroicons/react/24/outline"
import { HomeIcon as HomeIconSolid, NewspaperIcon as NewspaperIconSolid,ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid, ShoppingBagIcon as ShoppingBagIconSolid, UserIcon as UserIconSolid } from "@heroicons/react/24/solid"


import Link from "next/link"
import { usePathname } from "next/navigation";

export default function TabBar(){
    const pathname = usePathname();

    return (

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-screen-sm w-full grid grid-cols-5 border-t border-neutral-600 bg-neutral-800 px-5 py-3">
            <Link href="/home" className="flex flex-col items-center space-y-1 text-white">
                {pathname === "/home" ? 
                <HomeIconSolid className="w-7 h-7"/> : 
                <HomeIconOutline className="w-7 h-7"/>}
                <span >홈</span>
            </Link>
            <Link href="/life" className="flex flex-col items-center space-y-1 text-white">
            {pathname === "/life" ? 
                (<NewspaperIconSolid className="w-7 h-7"/>) : 
                (<NewspaperIconOutline className="w-7 h-7"/>)}
                <span>동네생활</span>
            </Link>
            <Link href="/chats" className="flex flex-col items-center space-y-1 text-white">
            {pathname === "/chats" ? 
                <ChatBubbleLeftRightIconSolid className="w-7 h-7"/> : 
                <ChatBubbleLeftRightIconOutline className="w-7 h-7"/>}
                <span>채팅</span>
            </Link>
            <Link href="/live" className="flex flex-col items-center space-y-1 text-white">
            {pathname === "/live" ? 
                <ShoppingBagIconSolid className="w-7 h-7"/> : 
                <ShoppingBagIconOutline className="w-7 h-7"/>}
                <span>쇼핑</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center space-y-1 text-white">
            {pathname === "/profile" ? 
                <UserIconSolid className="w-7 h-7"/> : 
                <UserIconOutline className="w-7 h-7"/>}
                    <span>프로필</span>
                </Link>
            </div>

    )
}