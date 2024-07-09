//import { PrismaClient } from '@prisma/client'
import {PrismaClient} from "@/prisma/generated/client"

declare global{
    var prismadb: PrismaClient
}
const client = prismadb || new PrismaClient()

if(process.env.NODE_ENV==='production'){
    prismadb = client
}

export default client