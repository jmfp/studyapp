import dbConnect from "@/app/lib/db/client";
import Post from "@/app/models/Post";
import { NextResponse } from "next/server";

export async function GET(request: Request){
    try {
        await dbConnect()
        const url = new URL(request.url)
        const searchParams = new URLSearchParams(url.searchParams)
        const posts = await Post.find({
            slug: {
                $eq: `${searchParams.get('slug')}`
            },
        })
        return new NextResponse(JSON.stringify(posts), {status: 201})
        
    } catch (error: any) {
        return NextResponse.json(error.message)
    }
}

export async function POST(request: Request){
    try {
        const body = await request.json()
        await dbConnect()
        const newPost = await Post.create(body)
        await newPost.save()
        return new NextResponse(JSON.stringify(newPost), {status: 201})
    } catch (error: any) {
        return NextResponse.json(error.message)
    }
}