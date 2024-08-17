'use server'

import { getSession } from "@/app/auth/auth"
import { PrismaClient } from "@/prisma/generated/client"
import { revalidatePath } from "next/cache"
import { redirect, RedirectType } from "next/navigation"

const prisma = new PrismaClient()

//convert file to base64
const toBase64 = async (file: File) => {
    const bufferFile = await file.arrayBuffer()
    const fileBase64 = Buffer.from(bufferFile).toString('base64')
    const finalString = `data:${file.type};base64,${fileBase64}`
    return finalString
  };

//export const fromBase64 = async (file: string) => {
//  const bufferFile = Buffer.from(file, "base64")
//  const newFile = Jimp.read(bufferFile, (err: any, res: any) => {
//    if (err) throw new Error(err);
//    res.quality(5).write("resized.jpg");
//  });
//  return newFile
//};

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
    redirect("/")
  }

export async function validateUser(user: any){
    try {
        const res = await prisma.user.findUnique({where:{email:user.email}})
        if (res && user.password === res.password){
            console.log(res)
            return (true)
        }
    } catch (error: any) {
        console.log(error.message)
    }
    return false
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


export async function addCourse(formData: FormData){
    const course_name = formData.get("course_name") as string
    const newCourse = await prisma.course.create({
      data:{
        course_name
      }
    })
    revalidatePath("/admin/course/new")
    redirect("/admin/course")
}

export async function getCourses(id?: string){
    const courses = await prisma.course.findMany({where: {id}})
    return courses
}

//export async function getCourses(id?: string){
//    const courses = await prisma.course.findMany({where: {id}})
//    return courses
//}
