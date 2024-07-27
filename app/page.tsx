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
  const posts = await prisma.post.findMany({})
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

        <div className="display: flex flex-col m-auto w-[50%] h-100 border border-green-500 rounded-lg">
          <textarea placeholder="Add a New Post"/>
          <div className="display: flex justify-evenly border-t border-green-500 p-6">
            <Button >Post</Button>
          </div>
        </div>
        
        <div className='m-auto grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 mt-5 gap-5 content-center'>
          {posts.length ? posts.map((post: any, idx: number) =>(
            <Card key={idx} className='m-[auto] max-w-[400px] max-h-[550px]'>
              <Image 
                src={post.image} 
                alt={post.slug} 
                width={200} 
                height={200}
                className="rounded-t-lg h-[300px] w-[100%] object-cover"
              />
              <CardContent className="mt-5 text-center">
                <h3 className="text-xl line-clamp-1 font-bold">{post.title}</h3>
                <div className="line-clamp-2 text-sm text-violet-500 mt-5">
                  {parse(post.description)}
                </div>
              </CardContent>
              <Button asChild className="w-[50%] mt-7 mb-7 ml-[25%]">
                <Link href={`/blog/${post.slug}`}>Read More</Link>
              </Button>
            </Card>
          )) : <span/>}
        </div>
      </div>
  );
}
