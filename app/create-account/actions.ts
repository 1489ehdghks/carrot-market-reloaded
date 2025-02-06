"use server"
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import db from "@/lib/db";
import {z} from "zod";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import getSession from "@/lib/session";

const checkUsername = (username: string) => username.includes("a");
const checkPassword = ({password,passwordConfirm}: {password: string, passwordConfirm: string}) => password === passwordConfirm;
const checkUniqueEmail = async (email: string) => {
    const user = await db.user.findUnique({where:{email},select:{id:true}});
    return !Boolean(user);
};


const formSchema = z.object({
    username: z.string({
        required_error: "Username is required",
        invalid_type_error: "Username must be a string"
    })
    .toLowerCase()
    .trim(),
    email: z.string().email().toLowerCase()
    .refine(checkUniqueEmail,{message:"Email already exists",path:["email"]}),
    // regex(PASSWORD_REGEX,{message: "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character111"}),
    password: z.string().min(PASSWORD_MIN_LENGTH),
    passwordConfirm: z.string().min(PASSWORD_MIN_LENGTH),
})
.refine(checkPassword,{message:"Both Passwords should be same!",path:["passwordConfirm"]})
.superRefine(async ({username},ctx)=>{
    const user = await db.user.findUnique({
        where:{username},
        select:{id:true}
    });
    if(user){
        ctx.addIssue({
            code:'custom',
            path:["username"],
            message:"Username already exists",
            fatal:true,
        });
        return z.NEVER;
    }
})



export async function CreateAccount(prevState: any, formData: FormData){
    const data = {
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        passwordConfirm: formData.get("passwordConfirm"),
    };
    const result = await formSchema.safeParseAsync(data);
    if (!result.success){
        return(result.error.flatten());
    }else{
        const hashedPassword = await bcrypt.hash(result.data.password, 12);
        const user = await db.user.create({
            data:{
                username: result.data.username,
                email: result.data.email,
                password: hashedPassword,
            },
            select:{
                id: true,
            }
        });
        const session = await getSession();
        if (!user.id) {
            throw new Error("User creation failed");
        }
        session.id=user.id;
        await session.save();
        redirect("/profile");

    }
}
