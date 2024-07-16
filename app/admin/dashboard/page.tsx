import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { getAllPosts } from "@/actions/actions"

export default async function Dashboard(){
    
    //prisma client
    const posts = await getAllPosts()

    return(
        <div className='display: flex flex-col w-[100%] justify-center items-center'>
            <div className='mt-2 mb-2'>
                <p>All Posts</p>
            </div>
            <div className="w-[80%] h-[800px] justify-center rounded-lg border-2 border-purple-500 overflow-y-scroll">
                {!posts.length ? <span/> : 
                    posts.map((post: any, idx: number) =>(
                        <div key={idx} className="display: flex w-[80%] m-auto gap-4 border-2 border-purple-500  justify-between items-center rounded-lg my-4">
                            <Image 
                                src={post.image} 
                                alt={post.slug} 
                                width={200} 
                                height={200}
                                className="h-[100px] w-[100px] rounded-lg object-cover"
                            />
                            <p>{post.title}</p>
                            <div className="display: flex gap-4 m-auto">
                                <form action={async () =>{
                                    'use server'
                                    await console.log("worked")
                                    //await deleteBlog
                                }}>
                                    <Button type='submit'>Delete</Button>
                                </form>
                                <Button>Edit</Button>
                            </div>
                        </div>
                    ))
                }
            </div>
            <div className="mt-2 mb-2">
                <Button asChild>
                    <Link href="/admin/posts/new">New Post</Link>
                </Button>
            </div>
        </div>
    )
}