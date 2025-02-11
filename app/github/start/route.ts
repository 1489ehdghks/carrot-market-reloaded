import { NextResponse } from "next/server";

export async function GET() {
    const baseUrl = "https://github.com/login/oauth/authorize";
    const config = {
        client_id: process.env.GITHUB_CLIENT_ID!,
        scope: "read:user,user:email",
        allow_signup: "true",
        ...(process.env.GITHUB_CALLBACK_URL && {
            redirect_uri: process.env.GITHUB_CALLBACK_URL
        })
    };
    
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    
    return NextResponse.redirect(finalUrl, {
        status: 302,
        headers: {
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://carrot-market-reloaded.vercel.app',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
    });
}