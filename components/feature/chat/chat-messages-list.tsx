"use client";

import { InitialChatMessage } from "@/app/chats/[id]/page";
import { formatToTimeAgo } from "@/lib/utils";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { ArrowUpIcon } from "@heroicons/react/24/solid";
import { saveMessage } from "@/app/chats/[id]/action";
import { updateMessage,deleteMessage, leaveChatRoom } from "@/app/chats/[id]/action";
import { getSupabaseClient } from '@/lib/supabase';
import Link from "next/link";


interface ChatMessageListProps{
    initialMessages: InitialChatMessage;
    userId: number;
    chatRoomId: string;
    username: string;
    avatar: string;
}

interface MessagePayload {
  id: number;
  content: string;
  created_at: Date;
  userId: number;
  user: {
      username: string;
      avatar: string | null;
  };
}

interface UpdatePayload {
  id: number;
  content: string;
}

interface DeletePayload {
  id: number;
}



export default function ChatMessagesList({initialMessages, userId, chatRoomId, username, avatar}:ChatMessageListProps){
    const [messages, setMessages] = useState(initialMessages);
    const [message, setMessage] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const channel = useRef<RealtimeChannel | null>(null);
    const inputRef = useRef<HTMLInputElement>(null); 
    const startEdit = (messageId: number, content: string) => {
        setEditingId(messageId);
        setEditContent(content);
      };
    
      const cancelEdit = () => {
        setEditingId(null);
        setEditContent("");
      };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {
            target: { value },
        } = e;
        setMessage(value);
    }
    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const savedMessage = await saveMessage(message, chatRoomId);
          
          const newMessage = {
            id: savedMessage.id,
            content: message,
            created_at: new Date(),
            userId,
            user: {
                username,
                avatar,
            }
        };
        
        setMessages(prevMsgs => [...prevMsgs, newMessage]);
        
        // Supabase 브로드캐스트
        channel.current?.send({
            type: "broadcast",
            event: "message",
            payload: newMessage
        });
        
        setMessage("");
        inputRef.current?.focus(); 
      } catch {
          alert("메시지 전송에 실패했습니다.");
      }
  }


    useEffect(() => {
        const client = getSupabaseClient();
        if (channel.current) {
          channel.current.unsubscribe();
        }
        channel.current = client.channel(`room-${chatRoomId}`);
        // 새 메시지 수신
        const messageHandler = ({ payload }: { payload: MessagePayload }) => {
          setMessages(prevMsgs => {
              // 중복 메시지 방지
              const exists = prevMsgs.some(msg => msg.id === payload.id);

              if (exists) return prevMsgs;
              return [...prevMsgs, payload];
          });
      };

      // 메시지 수정
      const updateHandler = ({ payload }: { payload: UpdatePayload }) => {
        setMessages(prevMsgs => {
            const msgIndex = prevMsgs.findIndex(msg => msg.id === payload.id);
            if (msgIndex === -1) return prevMsgs;
            
            const newMsgs = [...prevMsgs];
            newMsgs[msgIndex] = {
                ...newMsgs[msgIndex], 
                content: payload.content,
            };
            return newMsgs;
        });
    };
    

      // 메시지 삭제
      const deleteHandler = ({ payload }: { payload: DeletePayload }) => {
        setMessages(prevMsgs => prevMsgs.filter(msg => msg.id !== payload.id));
    };

      if (channel.current) {
      channel.current
      .on("broadcast", { event: "message" }, messageHandler)
      .on("broadcast", { event: "message_update" }, updateHandler)
      .on("broadcast", { event: "message_delete" }, deleteHandler)
      .subscribe();
      }

      return () => {
        if (channel.current) {
            channel.current.unsubscribe();
        }
    };
    }, [chatRoomId]);



    return (
        <div className="relative">
<div className="fixed top-0 w-full max-w-screen-sm bg-neutral-800 p-4 flex justify-between items-center z-10">
  <Link href="/chats" className="text-neutral-400 hover:text-neutral-300">
    ← 뒤로
  </Link>
  <div className="flex flex-col items-center">
    <span className="font-medium">{username}</span>
  </div>
  <button 
    onClick={() => {
      if (window.confirm("정말 채팅방을 나가시겠습니까?\n나가기 후에는 다시 들어올 수 없습니다.")) {
        leaveChatRoom(chatRoomId);
      }
    }}
    className="text-red-500 hover:text-red-400 text-sm"
  >
    채팅방 나가기
  </button>
</div>
        <div className="p-5 pt-16 flex flex-col gap-5 min-h-screen justify-end">
        {messages.map((message) => (
          <div key={message.id} className={`group flex gap-3 items-start ${message.userId === userId ? "flex-row-reverse" : "flex-row"}`}>
            {message.userId === userId ? null : (
              <Image 
                src={message.user.avatar!} 
                alt={message.user.username || "avatar"} 
                width={50} 
                height={50} 
                className="size-10 rounded-full"
              />
            )}
            <div className="flex flex-col gap-1">
              {message.userId === userId && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 mb-1">
                  <form action={deleteMessage.bind(null, message.id)}>
                    <button className="text-red-500 text-xs">삭제</button>
                  </form>
                  <button 
                    onClick={() => startEdit(message.id, message.content)}
                    className="text-blue-500 text-xs"
                  >
                    수정
                  </button>
                </div>
              )}
              {editingId === message.id ? (
                <form 
    onSubmit={async (e) => {
        e.preventDefault();
        try {
            const result = await updateMessage(message.id, editContent);
            if (result.error) {
                alert(result.error);
                return;
            }

            channel.current?.send({
                type: "broadcast",
                event: "message_update",
                payload: {
                    id: message.id,
                    content: editContent
                }
            });

            cancelEdit();
        } catch {
            alert("메시지 수정에 실패했습니다.");
        }
    }}
    className="flex gap-2"
>
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-neutral-700 rounded-md p-2 text-sm flex-1"
                  />
                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      className="text-blue-500 text-xs"
                    >
                      완료
                    </button>
                    <button 
                      type="button" 
                      onClick={cancelEdit}
                      className="text-neutral-500 text-xs"
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <span className={`p-2.5 rounded-md ${message.userId === userId ? "bg-neutral-500" : "bg-orange-500"}`}>
                  {message.content}
                </span>
              )}
              <span className={`text-xs ${message.userId === userId ? "text-right" : ""}`}>
                {formatToTimeAgo(message.created_at.toString())}
              </span>
            </div>
          </div>
        ))}
            <form className="flex relative gap-2" onSubmit={onSubmit}>
                <input 
                ref={inputRef} 
                required
                onChange={onChange}
                type="text"
                value={message}
                name="message"
                placeholder="Type a message"
                className="bg-transparent rounded-full w-full"
                />
                <button 
                    type="submit" 
                    className="bg-orange-500 text-white rounded-full p-3 hover:bg-orange-600 transition-colors"
                    >
                    <ArrowUpIcon className="size-5" />
                </button>
            </form>

        </div>
    </div>
    )
}
