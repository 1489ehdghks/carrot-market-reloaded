import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "./session";

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  if (!session.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      role: true
    }
  });

  return user;
}

export type Session = Awaited<ReturnType<typeof getSession>>; 