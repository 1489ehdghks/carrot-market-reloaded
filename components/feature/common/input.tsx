//type이 필요하기 전까지는 interface를 사용하는 것을 권장
import { forwardRef,ForwardedRef,InputHTMLAttributes } from "react";


interface FormInputProps{
    name : string;
    className?: string;
    errors?: string[];
}

const _Input = ({errors=[], name, ...rest}: FormInputProps & InputHTMLAttributes<HTMLInputElement>,ref: ForwardedRef<HTMLInputElement>) => {
    return(
        <div className="flex flex-col gap-2">
            <input ref={ref} name={name} {...rest} className="bg-transparent rounded-md w-full h-10 focus:outline-none ring-1 focus:ring-2 ring-neutral-200 focus:ring-orange-500 border-none placeholder:text-neutral-400" />
            <span className="text-red-500 font-medium">{errors.map((error,index) =>(
                <span key={index}>{error}</span>
            ))}</span>
        </div>
    )
}

export default forwardRef(_Input);