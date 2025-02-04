"use server";
import { db } from "@/lib/db";
import getSession from "@/lib/session";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveMessage(content:string, chatRoomId:string){
    const session = await getSession();
    await db.message.create({
        data:{
            content,
            chatRoomId,
            userId: session.id!,
        },
        select:{
            id: true,  
        }
    })
}

export async function updateMessage(messageId: number, newContent: string) {
    const session = await getSession();
    const message = await db.message.findUnique({
        where: { id: messageId },
        select: { userId: true, chatRoomId: true }
    });

    if (message?.userId !== session.id) {
        return { error: "권한이 없습니다." };
    }

    try {
        // 1. DB 업데이트
        await db.message.update({
            where: { id: messageId },
            data: { content: newContent }
        });

        // 2. Supabase 브로드캐스트
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        await supabase.channel(`room-${message?.chatRoomId}`).send({
            type: 'broadcast',
            event: 'message_update',
            payload: {
                id: messageId,
                content: newContent
            }
        });

        return { success: true };
    } catch (error) {
        console.error("메시지 수정 실패:", error);
        return { error: "메시지 수정에 실패했습니다." };
    }
}

export async function deleteMessage(messageId: number): Promise<void> {
    const session = await getSession();
    console.log("세션 확인:", session);

    const message = await db.message.findUnique({
        where: { id: messageId },
        select: { userId: true, chatRoomId: true }
    });
    console.log("메시지 확인:", message);

    // 권한 체크 로직 수정
    if (!session?.id || !message || message.userId !== session.id) {
        throw new Error("권한이 없습니다.");
    }

    await db.message.delete({
        where: { id: messageId }
    });

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.channel(`room-${message.chatRoomId}`).send({
        type: 'broadcast',
        event: 'message_delete',
        payload: { id: messageId }
    });
}


  
export async function leaveChatRoom(chatRoomId: string) {
    const session = await getSession();
    
    await db.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        users: {
          disconnect: {
            id: session.id!
          }
        }
      }
    });
  
    revalidatePath("/chats");
    redirect("/chats");
}