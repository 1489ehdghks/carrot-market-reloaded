"use client"

import { HomeIcon as HomeIconOutline, NewspaperIcon as NewspaperIconOutline,ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconOutline, ShoppingBagIcon as ShoppingBagIconOutline, UserIcon as UserIconOutline } from "@heroicons/react/24/outline"
import { HomeIcon as HomeIconSolid, NewspaperIcon as NewspaperIconSolid,ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid, ShoppingBagIcon as ShoppingBagIconSolid, UserIcon as UserIconSolid } from "@heroicons/react/24/solid"


import Link from "next/link"
import { usePathname } from "next/navigation";

export default function TabBar(){
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-neutral-900 to-neutral-800 border-t border-neutral-700/50 backdrop-blur-lg">
            <div className="max-w-screen-sm mx-auto px-8 py-3">
                <div className="grid grid-cols-5 gap-1">
                    <Link 
                        href="/home" 
                        className={`flex flex-col items-center space-y-1 transition-colors duration-300
                            ${pathname === "/home" 
                                ? "text-blue-400" 
                                : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                        {pathname === "/home" 
                            ? <HomeIconSolid className="w-6 h-6"/> 
                            : <HomeIconOutline className="w-6 h-6"/>}
                        <span className="text-xs font-medium">홈</span>
                    </Link>
                    
                    <Link 
                        href="/life" 
                        className={`flex flex-col items-center space-y-1 transition-colors duration-300
                            ${pathname === "/life" 
                                ? "text-blue-400" 
                                : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                        {pathname === "/life" 
                            ? <NewspaperIconSolid className="w-6 h-6"/> 
                            : <NewspaperIconOutline className="w-6 h-6"/>}
                        <span className="text-xs font-medium">요청</span>
                    </Link>
                    
                    <Link 
                        href="/chats" 
                        className={`flex flex-col items-center space-y-1 transition-colors duration-300
                            ${pathname === "/chats" 
                                ? "text-blue-400" 
                                : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                        {pathname === "/chats" 
                            ? <ChatBubbleLeftRightIconSolid className="w-6 h-6"/> 
                            : <ChatBubbleLeftRightIconOutline className="w-6 h-6"/>}
                        <span className="text-xs font-medium">채팅</span>
                    </Link>
                    <Link 
                        href="/live" 
                        className={`flex flex-col items-center space-y-1 transition-colors duration-300
                            ${pathname === "/live" 
                                ? "text-blue-400" 
                                : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                        {pathname === "/live" 
                            ? <ShoppingBagIconSolid className="w-6 h-6"/> 
                            : <ShoppingBagIconOutline className="w-6 h-6"/>}
                        <span className="text-xs font-medium">라이브러리</span>
                    </Link>
                    
                    
                    <Link 
                        href="/profile" 
                        className={`flex flex-col items-center space-y-1 transition-colors duration-300
                            ${pathname === "/profile" 
                                ? "text-blue-400" 
                                : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                        {pathname === "/profile" 
                            ? <UserIconSolid className="w-6 h-6"/> 
                            : <UserIconOutline className="w-6 h-6"/>}
                        <span className="text-xs font-medium">프로필</span>
                    </Link>
                </div>
            </div>
        </nav>
    )
}