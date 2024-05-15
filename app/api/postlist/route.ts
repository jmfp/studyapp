import dbConnect from "@/app/lib/db/client";
import Post from "@/app/models/Post";
import { NextResponse } from "next/server";

export async function GET(){
    await dbConnect()
    console.log(`database connected`)
    const posts = await Post.find({})
    //return allPosts
    //return JSON.stringify(posts)
    return NextResponse.json(posts, {status: 201})  
}