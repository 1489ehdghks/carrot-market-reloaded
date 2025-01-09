import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import getSession from "@/lib/session";

async function SignIn(user_id:number){
    const session = await getSession();
    session.id = user_id;
    await session.save();
}

async function generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = `GH#1${baseUsername}`;
    let counter = 1;
    
    while (true) {
      const existingUser = await db.user.findUnique({
        where: {
          username: username
        }
      });
      
      if (!existingUser) {
        return username;
      }
      
      counter++;
      username = `GH#${counter}${baseUsername}`;
    }
  }


export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return notFound();
    }

    const accessTokenParams = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }).toString();

      const accessTokenURL = `https://github.com/login/oauth/access_token?${accessTokenParams}`;
      const accessTokenResponse = await fetch(accessTokenURL, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const { error, access_token } = await accessTokenResponse.json();
      if (error) {
        return new Response(null, {
            status: 400,
          });
        }

        const userProfileResponse = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
            cache: "no-cache",
          });


          const { id, avatar_url, login } = await userProfileResponse.json();


          const user = await db.user.findUnique({
            where: {
              github_id: id + "",
            },
            select: {
              id: true,
            },
          });

          if (user) {
            await SignIn(user.id);
            return redirect("/profile");
          }

          const newUser = await db.user.create({
            data: {
              username: await generateUniqueUsername(login),
              github_id: id + "",
              avatar: avatar_url,
            },
            select: {
              id: true,
            },
          });

          await SignIn(newUser.id);
          return redirect("/profile");
}