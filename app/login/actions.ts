"use server";

import { z } from "zod";
import { PASSWORD_MIN_LENGTH, PASSWORD_REGEX, PASSWORD_REGEX_ERROR } from "@/lib/constants";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";

const checkEmailExists = async (email: string) => {
    const user = await db.user.findUnique({
        where: {
            email: email,
        },
        select: {
            id: true,
        }
    });
    return Boolean(user);
}


//.regex(PASSWORD_REGEX,PASSWORD_REGEX_ERROR)
const formSchema = z.object({
    email: z.string().email().toLowerCase().trim().refine(checkEmailExists,{message: "Email does not exist"}),
    password: z.string({
        required_error: "Password is required",
    }).min(PASSWORD_MIN_LENGTH),
});

export async function login(prevState: any,formData: FormData) {
    const data = {
        email: formData.get("email"),
        password: formData.get("password"),
    };
    const result = await formSchema.safeParseAsync(data);
    if (!result.success){
        return(result.error.flatten());
    }else{
        //find user with
        const user = await db.user.findUnique({
            where: {
                email: result.data.email,
            },
            select: {
                id: true,
                password: true,
            }
        });
        const ok = await bcrypt.compare(result.data.password,user!.password ?? "");
        if(ok){
            const session = await getSession();
            session.id=user!.id;
            await session.save();
            redirect("/profile");
        }else{
            return {
                fieldErrors:{
                    password:["Wrong password"],
                    email:[],
                }
            }
        }

    }
}