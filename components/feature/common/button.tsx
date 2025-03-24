'use client'

import { useFormStatus } from "react-dom";

interface FormBtnProps {
    text: string;
    variant?: "primary" | "secondary" | "destructive";
    onClick?: () => void;
}

export default function FormBtn({ text, variant = "primary", onClick }: FormBtnProps) { 
    const { pending } = useFormStatus();
    
    return (
        <button 
            onClick={onClick}
            disabled={pending} 
            className={`
                relative overflow-hidden h-12 flex-1 rounded-lg font-medium transition-all duration-300
                ${variant === "primary" ? "primary-btn" : ""}
                ${variant === "secondary" ? "bg-neutral-700 text-white hover:bg-neutral-600" : ""}
                ${variant === "destructive" ? "bg-red-600 text-white hover:bg-red-500" : ""}
                disabled:bg-neutral-400 disabled:text-neutral-300 disabled:cursor-not-allowed
                disabled:transform-none disabled:hover:scale-100
            `}
        >
            <span className="relative z-10">{pending ? "Loading..." : text}</span>
        </button>
    );
}

