import { getUser, getUserPosts, sendFriendRequest, fromBase64, getUserFriends, getUserObject } from '@/actions/actions'
import { getSession } from '@/app/auth/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import ReactPlayer from 'react-player'
import Base64VideoPlayer from '@/app/components/video/Video'
import Post from '@/app/components/post/Post'
import { post } from '@/app/lib/interface'
import { FaUserFriends } from "react-icons/fa";
import { ParallaxHero } from '@/app/components/images/image'

export default async function UserPage({params}: {params:{id: string}}) {
    const user = await getUser()
    const userPosts = await getUserPosts(params.id)
    //const friends = await getUserFriends(user)
    //const userObject = await getUserObject(user)
    const pageUser = await getUserObject(params.id)
    console.log(userPosts)
  return (
    <div>
       <ParallaxHero style='p-48' height={60} image="https://images.unsplash.com/photo-1427501482951-3da9b725be23?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D">

       <Image 
          src={`${decodeURI(pageUser?.profilePic) || pageUser?.profilePic}`}
          alt=""
          height={1080}
          width={1920}
          className='object-cover h-24 w-24 m-auto border border-primary rounded-full '
        />
       </ParallaxHero>
       <div className='display: flex justify-center ml-36 mt-6 items-center'>
       <p className="text-primary ml-6">{pageUser?.username}</p>
       <FaUserFriends className="text-primary mx-3"/>
        <p>{pageUser?.friends.length}</p>
       </div>
      <div className='display: flex justify-center w-full h-60 mt-14'>
        <form action={async (formData: FormData) =>{
          'use server'
          if(user !== params.id){
            await sendFriendRequest(user, params.id)
          }
        }}>
          {pageUser?.friends.includes(user) || user === params.id ? 
          <p className='text-primary'>{`You and ${pageUser?.username} are friends.`}</p>:
            <Button type="submit">Add Friend</Button>
          }
          
        </form>
      </div>
      <div className="display: flex flex-col overflow-y-scroll">
          {!userPosts? <span/> : 
              userPosts.map((post: any, index: number) => {
                const newPost = {
                  friendId: params.id,
                  pic: pageUser?.profilePic,
                  content: post.content,
                  pictures: post.pictures,
                  likes: post.likes
                }
                return(
                  <Post post={
                    newPost
                  }/>
                )
              })
          }
      </div>
      <div>
      </div>
    </div>
  )
}
