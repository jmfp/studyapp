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
import { addPost, getFeedPosts, getLatestPost, getUser, getUserFriends, getUserObject } from "@/actions/actions";
import { getSession } from "./auth/auth";
import { redirect } from "next/navigation";
import { GiHearts } from "react-icons/gi";
import { TiCamera } from "react-icons/ti";
import ReactPlayer from 'react-player'
import { BsCameraVideoFill } from "react-icons/bs";
import Post from "./components/post/Post";
import { post } from '@/app/lib/interface';
import SuggestedFriends from "./components/container/Sidebar";

export const revalidate = 30

//design interface for post return
//export interface post{
//  image?: string,
//  description: string,
//  content: string,
//  profilePic: string,
//  likes: number
//}

//prisma client
const prisma = new PrismaClient()

export default async function Home() {
  //const posts = await fetchPosts()
  //getting current user session
  const session = await getSession()
  if (!session){
    redirect("/signin")
  }
  const userObject = await getUser()
  console.log(userObject)
  const user = await getUserObject('66b6b7daeb7f7c4a9bc6ee78')
  //const user = await prisma.user.findUnique({where: {
  //  email: session.user.email
  //}})
  //const posts = await prisma.post.findMany({where:{
  //  userId: user?.id
  //}})
  let feed: any = []
  feed.push(await prisma.post.findFirst({where:{userId: user?.friends[0]}}))

  //get feed for user
  const newFeed = await getFeedPosts(user?.id)

  return (
      <div className='display: flex w-[100%] h-full justify-space-between mb-14'>
        <div className="display: flex flex-col w-[15%]">
          <Link href={`/user/${userObject}`}>
            <Image
              src={user?.profilePic !== "" ? `${user?.profilePic}` : "https://images.unsplash.com/photo-1720975945110-6278215f280d?q=80&w=3269&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
              alt="User Icon"
              width={200}
              height={200}
              className="m-auto mb-6 border border-primary rounded-full sm:h-[12px] sm:w-[12px] sm:ml-3 lg:h-[100px] lg:w-[100px] object-cover"
            />
          </Link>
          <Link href={"/signin"}>
            <MenuItem icon={BiLogOut} text="Logout"/>
          </Link>
          
        </div>

        {/* post field for user */}

        <div className="display: flex flex-col m-auto w-[80%]">

          <div className="display: flex flex-col m-auto w-[90%] h-100 border border-primary rounded-lg">
            <form action={async (formData: FormData) =>{
              'use server'
              formData.append('userId', `${user?.id}`)
              await addPost(formData)
            }}>
              <textarea className="resize-none w-full h-full rounded-tl-lg rounded-tr-lg text-primary p-6" name="content" placeholder="Add a New Post"/>
              <div className="display: flex flex-col justify-between border-t border-primary p-6 h-full">
                <TiCamera className="h-12 text-4xl"/>
                <input type="file" name="pictures" accept=".jpeg, .jpg, .png"/>
                <Button className='mt-3' type="submit">Post</Button>
              </div>
            </form>
          </div>
          
          <div className='display: flex flex-col mt-4 w-full'>
            {newFeed.length ? newFeed.map((post: post, idx: number) =>(
              <div key={idx} className="display: flex flex-col mt-3 m-auto w-full min-h-20">
                <Post post={post}/>
              </div>
            )) : <span/>}
          </div>
        </div>
          <SuggestedFriends />
      </div>
  );
}
