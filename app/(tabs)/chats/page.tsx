import { db } from "@/lib/db";
import getSession from "@/lib/session";
import Image from "next/image";
import Link from "next/link";
import { formatToTimeAgo } from "@/lib/utils";

async function getChatRooms() {
  const session = await getSession();
  const rooms = await db.chatRoom.findMany({
    where: {
      users: {
        some: {
          id: session.id!
        }
      }
    },
    include: {
      users: {
        where: {
          NOT: {
            id: session.id!
          }
        },
        select: {
          username: true,
          avatar: true,
        }
      },
      messages: {
        take: 1,
        orderBy: {
          created_at: 'desc'
        },
        select: {
          content: true,
          created_at: true,
        }
      }
    },
    orderBy: {
      messages: {
        _count: 'desc'
      }
    }
  });
  return rooms;
}

export default async function Chats() {
  const rooms = await getChatRooms();
  
  return (
    <div className="p-5 flex flex-col">
      {rooms.map((room) => (
        <Link 
          href={`/chats/${room.id}`} 
          key={room.id} 
          className="flex gap-4 items-center py-3 border-b border-neutral-800 last:border-0"
        >
          <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden">
            {room.users[0]?.avatar ? (
              <Image
                src={room.users[0].avatar}
                alt=""
                width={48}
                height={48}
                className="object-cover"
              />
            ) : (
              <span className="text-2xl">{room.users[0]?.username?.[0]}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span>{room.users[0]?.username}</span>
              <span className="text-xs text-neutral-400">
                {room.messages[0] && formatToTimeAgo(room.messages[0].created_at.toString())}
              </span>
            </div>
            {room.messages[0] && (
              <p className="text-sm text-neutral-400 truncate mt-1">
                {room.messages[0].content}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}