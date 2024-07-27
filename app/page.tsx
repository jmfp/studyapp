import Link from "next/link";
import Image from "next/image";
import styles from "./sass/components/Container.module.scss"
import { blogCard } from "./lib/interface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import parse from 'html-react-parser';
import {PrismaClient} from "@/prisma/generated/client"
import MenuItem from "./components/menu/menu";
import { GiIciclesAura, GiDiceTwentyFacesTwenty } from "react-icons/gi";
import { BiLogOut } from "react-icons/bi";
import { addPost, getUser } from "@/actions/actions";
import { getSession } from "./auth/auth";
import { redirect } from "next/navigation";

export const revalidate = 30

//design interface for post return
export interface post{
  title: string,
  image: string,
  slug: string,
  description: string,
  content: string
}

//prisma client
export const prisma = new PrismaClient()

export default async function Home() {
  //const posts = await fetchPosts()
  //getting current user session
  const session = await getSession()
  if (!session){
    redirect("/signin")
  }
  const userObject = await getUser(session.user.email)
  const user = await prisma.user.findUnique({where: {
    email: session.user.email
  }})
  console.log(user?.id)
  const posts = await prisma.post.findMany({where:{
    userId: user?.id
  }})
  //const test = await newView()

  return (
      <div className='display: flex w-[100%] justify-space-between mb-14'>
        <div className="display: flex flex-col border-r border-b border-b-green-400 h-full border-r-green-400 w-[15%]">
          <Image
            src="https://images.unsplash.com/photo-1720975945110-6278215f280d?q=80&w=3269&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="User Icon"
            width={200}
            height={200}
            className="m-auto mb-6 border border-green-400 rounded-full h-[100px] w-[100px] object-cover"
          />
          <Link href={"/characters"}>
            <MenuItem icon={GiIciclesAura} text="Characters"/>
          </Link>
          <Link href={"/characters"}>
            <MenuItem icon={GiDiceTwentyFacesTwenty} text="Campaigns"/>
          </Link>
          <Link href={"/signin"}>
            <MenuItem icon={BiLogOut} text="Logout"/>
          </Link>
          
        </div>

        {/* post field for user */}

        <div className="display: flex flex-col m-auto w-[80%]">

          <div className="display: flex flex-col m-auto w-[100%] h-100 border border-green-500 rounded-lg">
            <form action={async (formData: FormData) =>{
              'use server'
              formData.append('userId', `${user?.id}`)
              console.log(formData)
              await addPost(formData)
            }}>
              <textarea name="content" placeholder="Add a New Post"/>
              <div className="display: flex justify-evenly border-t border-green-500 p-6">
                <Button type="submit">Post</Button>
              </div>
            </form>
          </div>
          
          <div className='display: flex flex-col m-auto w-full border h-[vh] gap-4'>
            {posts.length ? posts.map((post: any, idx: number) =>(
              <div className="display: flex flex-col m-auto w-full h-60 border border-green-500 rounded-lg gap-4">
                <p>{post.content}</p>
              </div>
            )) : <span/>}
          </div>

        </div>
      </div>
  );
}
