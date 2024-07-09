import Link from "next/link";
import Image from "next/image";
import styles from "./sass/components/Container.module.scss"
import { client, urlFor } from "./lib/sanity";
import { blogCard } from "./lib/interface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import parse from 'html-react-parser';
import { supabase } from "./lib/db/supabase";
import { PrismaClient } from "@prisma/client";

export const revalidate = 30

//design interface for post return
export interface post{
  title: string,
  image: string,
  slug: string,
  description: string,
  content: string
}

//testing supabase
async function newView(){
  const { data, error } = await supabase
    .from("views")
    .insert({
      name: 'random name'
    })
    if (data) console.log(data)
    if (error) console.log(error)
}

//fetch posts from mongodb
async function fetchPosts(){
  try {
    const res = await fetch(`${process.env.API_URL}/api/postlist`)
    const posts = await res.json()
    return (posts)
  } catch (error: any) {
    console.log(error.message)
  }
}

//prisma client
const prisma = new PrismaClient()

export default async function Home() {
  //const posts = await fetchPosts()
  const posts = await prisma.post.findMany({})
  //const test = await newView()

  return (
      <div className='display: flex w-[100%] justify-center mb-14'>
        <div className='grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 mt-5 gap-5 content-center'>
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
