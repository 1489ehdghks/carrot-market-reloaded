import ChatMessagesList from "@/components/chat-messages-list";
import {db} from "@/lib/db";
import getSession from "@/lib/session";
import { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getRoom(id:string){
    const room = await db.chatRoom.findUnique({

        where: {
            id: id,
        },
        include: {
            users: {
                select: {id: true}
            }

        },
    });
    if (room) {
        const session = await getSession();
        if (!session) {
            return null;  // 세션이 없으면 접근 불가
        }
        
        const canSee = room.users.some(user => user.id === session.id);
        if (!canSee) {
            return null;  // 권한이 없으면 접근 불가
        }
    }
    return room;

}

async function getMessages(chatRoomId:string){
    const messages = await db.message.findMany({
        where: {
            chatRoomId,
        },
        select: {
            id: true,
            content: true,
            created_at: true,
            userId: true,
            user: {
              select: {
                avatar: true,
                username: true,
              },
            },
          },
        });
    return messages;
}

async function getUserProfile() {
    const session = await getSession();
    const user = await db.user.findUnique({
      where: {
        id: session.id!,
      },
      select: {
        username: true,
        avatar: true,
      },
    });
    return user;
  }
  
export type InitialChatMessage = Prisma.PromiseReturnType<typeof getMessages>;

export default async function ChatRoom({ params }: PageProps) {
    const { id } = await params;
    const room = await getRoom(id);
    if (!room) {
        return notFound();
    }

    const messages = await getMessages(id);
    const session = await getSession();
    const user = await getUserProfile();
    if(!user){
        return notFound();
    }

    return (
        <ChatMessagesList
            chatRoomId={id} 
            userId={session.id!} 
            username={user.username}
            avatar={user.avatar!}
            initialMessages={messages} />
    )
    
}
