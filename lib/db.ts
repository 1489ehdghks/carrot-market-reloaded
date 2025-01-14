import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

async function test(){
    const token = await db.sMSToken.findUnique({
        where: {
            id: 1,
        },
        include: {
            user: true
        }
    })
}


test();

export default db;
