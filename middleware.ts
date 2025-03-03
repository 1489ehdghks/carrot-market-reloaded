import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";

interface Routes {
    [key:string]:boolean;
}

const publicOnlyUrls:Routes = {
    "/":true,
    "/login":true,
    "/sms":true,
    "/create-account":true,
    "/github/start":true,
    "/github/complete":true,
}

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get(sessionOptions.cookieName);
    const exists = publicOnlyUrls[request.nextUrl.pathname];

    if(!sessionCookie?.value){
       if(!exists){
        return NextResponse.redirect(new URL("/", request.url));
       }
    } else {
        if(exists){
            return NextResponse.redirect(new URL("/home", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};