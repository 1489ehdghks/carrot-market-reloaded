"use server";

import crypto from "crypto";
import twilio from "twilio";
import { z } from "zod";
import validator from "validator";
import { redirect } from "next/navigation";
import getSession from "@/lib/session";
import db from "@/lib/db";

async function tokenExists(token:number) {
    const exists = await db.sMSToken.findUnique({
        where:{token:token.toString()},
        select:{id:true}
    })
    return Boolean(exists)
}

const phoneSchema = z.string().trim().refine(phone => validator.isMobilePhone(phone,"ko-KR"),{message: "Wrong phone format"})
const tokenSchema = z.coerce.number().min(100000).max(999999).refine(tokenExists,"this token is not exists");

interface ActionState {
    token: boolean
}

async function getToken(){
    const token = crypto.randomInt(100000,999999).toString();
    const exists = await db.sMSToken.findUnique({
        where:{token:token},
        select:{id:true}
    })
    if(exists){
        return getToken();
    }else{
        return token;
    }
}

export async function smsLogin(prevState: ActionState,formData: FormData){
    const phone = formData.get("phone")
    const token = formData.get("token")
    if(!prevState.token){
        const result = phoneSchema.safeParse(phone)
        if(!result.success){
            return {token: false, error: result.error.flatten()}
        }else{
            await db.sMSToken.deleteMany({
                where:{
                    user:{
                        phone:result.data
                    }
                }})
            //이전 토큰 삭제
            const token = await getToken();
            await db.sMSToken.create({
                data:{
                    token,
                    user:{
                        connectOrCreate:{
                            where:{
                                phone:result.data
                            },
                            create:{
                                username:crypto.randomBytes(10).toString("hex"),
                                phone:result.data
                            }}}
                }
            })
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            )
            await client.messages.create({
                //result.data는 사용자의 전화번호,
                body:`Your verification code is ${token}`,
                from:process.env.TWILIO_PHONE_NUMBER!,
                to:result.data!,
            })
            return {token: true}
        }
    }else{
        const result = await tokenSchema.safeParseAsync(token);
        if(!result.success){
            return {
                token: true,
                error: result.error.flatten()
            }
        }else{
            //get userId of token
            const token = await db.sMSToken.findUnique({
                where:{token:result.data.toString()},
                select:{id:true,userId:true}    
            })

                const session = await getSession();
                session.id = token!.userId;
                await session.save();
                await db.sMSToken.delete({
                    where:{
                        id:token!.id
                    }
                })
            
            redirect("/profile");
        }
    }
}
