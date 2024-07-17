'use server'

import { PrismaClient } from "@/prisma/generated/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const prisma = new PrismaClient()

export const addBlog = async (formData: any) => {
    const title = formData["title"]
    const image = formData["image"]
    const slug = formData["slug"]
    const description = formData["description"]
    const content = formData["content"]
    const category = formData["category"]
    const new_blog = await prisma.post.create({
        data:{
            image: image,
            title: title,
            slug: slug,
            description: description,
            content: content, 
            category: category
        }
    })

    //revalidate cache for server action
    revalidatePath('/admin/posts/new')
    redirect('/')
}

export const addCharacter = async (formData: any) =>{
    const characterName = formData["characterName"]
    const new_character = await prisma.character.create({
        data:{
            name: characterName

        }
    })
}

export const deleteBlog = async(id: any) =>{
    prisma.post.delete({where: {id: id}})
}

export const getAllPosts = async() => {
    revalidatePath('/admin/dashboard')
    return await prisma.post.findMany({})
}
