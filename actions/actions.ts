'use server'

import { PrismaClient } from "@/prisma/generated/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

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

export async function signUp(formData: FormData){
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const username = formData.get("username") as string
    const newUser = await prisma.user.create({
      data:{
        email,
        password,
        username
      }
    })
  }

export async function validateUser(user: any){
    try {
        const res = await prisma.user.findUnique({where:{email:user.email}})
        if (res && user.password === res.password){
            return (true)
        }
    } catch (error: any) {
        console.log(error.message)
    }
}

export const addCharacter = async (formData: any) =>{
    const characterName = formData.get("characterName")
    const race = formData.get("race") as string
    const pclass = formData.get("pclass")
    const background = formData.get("background")
    const backstory = formData.get("backstory")
    const attributes = await get5eRaceAttributes(race)
    console.log(attributes)
    const new_character = await prisma.character.create({
        data:{
            name: characterName,
            race,
            pclass,
            background,
            backstory
        }
    })
    revalidatePath('/characters/new')
    redirect('/characters')
}

//gets all of the choices available for race when creating a character
export const get5eRaceAttributes = async (race: string) =>{
    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/races/${race}`).then(
            (response) => response.text()
        )
        let jsonAttributes = {speed: JSON.parse(`${res}`).speed, 
            languages: JSON.parse(`${res}`).languages,
            size: JSON.parse(`${res}`).size,
            ability_bonuses: JSON.parse(`${res}`).ability_bonuses,
            starting_proficiencies: JSON.parse(`${res}`).starting_proficiencies,
            traits: JSON.parse(`${res}`).traits,
            subraces: JSON.parse(`${res}`).subraces
        }
        //console.log(jsonAttributes)
        return jsonAttributes
    } catch (error: any) {
        console.log(error.message)
    }
}

//returns all classes from dnd5e api
export const get5eClasses = async (playerclass?: string) =>{
    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/classes/${playerclass ? playerclass : ""}`).then(
            (response) => response.text()
        )
        return JSON.parse(`${res}`)
    } catch (error: any) {
        console.log(error.message)
    }
}

//returns all races from vanilla dnd5e
export const get5eRaces = async (race?: string) =>{

    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/races/${race ? race : ""}`)
        .then((response) => response.text())

        return JSON.parse(`${res}`)
    } catch (error: any) {
        console.log(error.message)
    }

}

//get all 5e backgrounds
export const get5eBackgrounds = async (background?: string) =>{
    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/backgrounds/${background ? background : ""}`)
        .then((response) => response.text())
        return JSON.parse(`${res}`)
    } catch (error: any) {
        console.log(error.message)
    }
}

//get 5e alignments
export const get5eAlignments = async (alignment?: string) =>{
    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/alignments/${alignment ? alignment : ""}`)
        .then((response) => response.text())
        return JSON.parse(`${res}`)
    } catch (error: any) {
        console.log(error.message)
    }
}

export const deleteBlog = async(id: any) =>{
    prisma.post.delete({where: {id: id}})
}

export const getAllPosts = async() => {
    revalidatePath('/admin/dashboard')
    return await prisma.post.findMany({})
}
