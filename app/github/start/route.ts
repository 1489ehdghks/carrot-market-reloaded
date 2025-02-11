import { redirect } from "next/navigation";

export async function GET() {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        scope: "read:user,user:email",
        allow_signup: "true",
    });

    return redirect(
        `https://github.com/login/oauth/authorize?${params.toString()}`
    );
}