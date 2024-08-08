import { getUser, getUserPosts, sendFriendRequest, fromBase64, getUserFriends } from '@/actions/actions'
import { getSession } from '@/app/auth/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import ReactPlayer from 'react-player'
import Base64VideoPlayer from '@/app/components/video/Video'
import Post from '@/app/components/post/Post'
import { post } from '@/app/lib/interface'
import { FaUserFriends } from "react-icons/fa";

export default async function UserPage({params}: {params:{id: string}}) {
    const user = await getUser()
    console.log(user)
    const userPosts = await getUserPosts(params.id)
    const friends = await getUserFriends(user)
    console.log(friends?.length)
  return (
    <div>
      <Image 
        src={"https://images.unsplash.com/photo-1427501482951-3da9b725be23?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
        alt=""
        height={1080}
        width={1920}
        className='object-cover h-60 w-full'
      />
      <div className='display: flex justify-center w-full h-60'>
        <Image 
          src={"https://images.unsplash.com/photo-1427501482951-3da9b725be23?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
          alt=""
          height={1080}
          width={1920}
          className='object-cover h-24 w-24 m-auto border border-primary rounded-full '
        />
        <form action={async (formData: FormData) =>{
          'use server'
          if(user !== params.id){
            await sendFriendRequest(user, params.id)
          }
        }}>
          <Button type="submit">Add Friend</Button>
        </form>
        <FaUserFriends />
        <p>{friends?.length}</p>
      </div>
      <div className="display: flex flex-col overflow-y-scroll">
          {!userPosts? <span/> : 
              userPosts.map((post: any, index: number) => (
                  <Post post={post}/>
              ))
          }
      </div>
      <div>
      </div>
    </div>
  )
}
