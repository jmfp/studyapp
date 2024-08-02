'use server'

import { getSession } from "@/app/auth/auth"
import { PrismaClient } from "@/prisma/generated/client"
import { revalidatePath } from "next/cache"
import { redirect, RedirectType } from "next/navigation"
import { NextResponse } from "next/server"
import fs from "node:fs/promises";

const prisma = new PrismaClient()

//convert file to base64
const toBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
  
      fileReader.readAsDataURL(file);
  
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
  
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

export const addPost = async (formData: any) => {
    const content = formData.get("content")
    const userId = formData.get("userId")
    const new_post = await prisma.post.create({
        data:{
            content,
            userId
        }
    })

    //revalidate cache for server action
    revalidatePath('/')
    //redirect('/')
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
    return false
}

export async function sendFriendRequest(user: string, receiver: string){
    try {
        const newRequest = await prisma.friendRequest.create({
            data:{
                userId: user,
                receiverId: receiver
            }
        })
        console.log(newRequest)
    } catch (error: any) {
        console.log(error.message)
    }
}


export const getFriendRequest = async (id: string) =>{
    try {
        const res = await prisma.friendRequest.findMany({where:{receiverId: id}})
        return res
    } catch (error: any) {
        console.log(error.message)
    }
}

export async function decideFriendRequest(approval: boolean, id: string){
    try {
        const user = await getUser()

        const request = await prisma.friendRequest.findUnique({where: {
            id
        }})
        if(approval){
            //add friend to user object
            await prisma.user.update({where:{
                id: request?.userId
            }, data:{
                friends: {
                    push: request?.receiverId
                }
            }})
            //add friend to the receiver object
            await prisma.user.update({where:{
                id: request?.receiverId
            }, data:{
                friends: {
                    push: request?.userId
                }
            }})
            await prisma.friendRequest.delete({where:{id}})
            //await prisma.friendRequest.delete({where: {
            //        receiverId: user
            //}})
        }
        if(!approval){
            await prisma.friendRequest.delete({where: {id}})
        }
        revalidatePath(`/user/${user}/notifications`)
        console.log("Success")
    } catch (error: any) {
        console.log(error.message)
    }
}

export async function getUser(){
    try {
        const session = await getSession()
        const email = session.user.email
        const res = await prisma.user.findUnique({where: {email}})
        return JSON.parse(`${JSON.stringify(res?.id)}`)
    } catch (error: any) {
        console.log(error.message)
    }
}

export async function getUserObject(id: string){
    try {
        const res = await prisma.user.findUnique({where: {id}})
        return res
    } catch (error: any) {
        console.log(error.message)
    }
}

export async function getUserFriends(id: any){
    try {
        const res = await prisma.user.findUnique({where: {id}})
        return res?.friends
    } catch (error: any) {
        console.log(error.message)
    }
}

export const deleteCharacter = async (id: string) => {
    try {
        const character = await prisma.character.findUnique({
            where: {
                id
            }
        })

        const user = await prisma.user.findUnique({where:
            {
                id: character?.userId?.toString()
            }
        })
        let chars = user?.characters
        chars?.splice(chars?.indexOf(id), 1)
        await prisma.character.delete({where: {id}})
        await prisma.user.update({where: {
            id: character?.userId?.toString() 
        }, data:{characters: chars}})
        revalidatePath("/characters")
    } catch (error: any) {
        console.log(error.message)
    }
}

export const getCharacters = async (userId: string, id?: string) =>{
    //if there is no specific character id passed, return all characters owned by the user
    if(!id){
        const characters = await prisma.character.findMany({where: {
            userId
        }})

        return characters
    }
    //if there is an id passed, return just the specific character
    const characters = await prisma.character.findMany({where: {
        id
    }})
    return characters
}

export const addCharacter = async (formData: any) =>{
    const characterName = formData.get("characterName")
    const race = formData.get("race") as string
    const pclass = formData.get("pclass")
    const background = formData.get("background")
    const backstory = formData.get("backstory")
    const user = formData.get("user")
    const userObject = await prisma.user.findUnique({where:{id: user}})
    let charList = userObject?.characters.length? userObject?.characters.length : 0
    if(!userObject?.subscribed && charList >= 1 ){
        //user cannot add more characters until subscribed
        redirect("/pricing")
        return "You need to subscribe to add more characters"
    }
    //const file = await fs.readFile("./public/images/drizzt1.jpeg")
    //const image = toBase64(file)
    const attributes = await get5eRaceAttributes(race)
    const new_character = await prisma.character.create({
        data:{
            name: characterName,
            race,
            pclass,
            background,
            backstory,
            equipment : [{}],
            languages : [{}],
            userId: user
        }
    })
    //adding ownership of new character to the current user 
    await prisma.user.update({where: {
        id: user
    }, data:{
        characters:{
            push: new_character.id

        }
    }})
    revalidatePath('/characters/new')
    redirect(`/characters/${new_character.id}`)
}

//gets all of the choices available for race when creating a character
export const get5eRaceAttributes = async (race: string) =>{
    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/races/${race.toLowerCase()}`).then(
            (response) => response.text()
        )
        //console.log(race)
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

export const get5eLanguages = async (language?: string) =>{
    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/languages/${language ? language : ""}`)
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

export const getUserPosts = async(id: any) => {
    revalidatePath('/admin/dashboard')
    return await prisma.post.findMany({where: {
        userId: id
    }})
}

export const getLatestPost = async(id: any) =>{
    return await prisma.post.findFirst({where: {
        userId: id
    }})
}

export const getFeedPosts = async(id: any) =>{
    const user = await prisma.user.findUnique({where: {id}})
    let friends = user?.friends
    let data: any = []
    let postData: any = {}
    async function buildFeed(){
        for(const idx in friends){
            //console.log(user)
            const friendObject = await prisma.user.findUnique({where: {id: friends[Number(idx)]}})
            const friendLatestPost = await prisma.post.findFirst({where:{userId: friends[Number(idx)]}})
            const friendPost = {
                pic: friendObject?.profilePic,
                content: friendLatestPost?.content,
                likes: friendLatestPost?.likes,
                friendId: friendObject?.id,
                comments: friendLatestPost?.comments,
            }
            data.push(friendPost)
        }
    }
    await buildFeed()
    console.log(data)
    return data
}
