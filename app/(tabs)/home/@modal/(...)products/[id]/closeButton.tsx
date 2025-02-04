"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function CloseButton(){
    const router = useRouter();
    const onCloseClick = () => {
        router.back();
    }
    return <button onClick={onCloseClick} className="absolute right-5 top-5 text-neutral-200 hover:text-orange-600 transition-colors">
        <XMarkIcon className="size-10" />
    </button>
}
