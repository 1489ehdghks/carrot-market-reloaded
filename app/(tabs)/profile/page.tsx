import getSession from "@/lib/session";
import db from "@/lib/db";
import { redirect,notFound } from "next/navigation";


async function getUser(){
    const session = await getSession();
    if(session.id){
        const user = await db.user.findUnique({
            where:{id:session.id}
        });
        if(user){
            return user;
        }
    }
    //notfound 페이지로 보냄
    notFound();
}

export default async function ProfilePage(){
    const user = await getUser();
    const logout = async () => {
        "use server";
        const session = await getSession();
        await session.destroy();
        redirect("/");
    }
    return (
    <div>
        <h1>{user?.username} Profile</h1>
        <form action={logout}>
            {/* <input type="submit" value="Log out" /> */}
            <button>Log out</button>
        </form>
    </div>
);
}

