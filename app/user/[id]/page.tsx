import { getUser, getUserPosts, sendFriendRequest } from '@/actions/actions'
import { getSession } from '@/app/auth/auth'
import { Button } from '@/components/ui/button'
import React from 'react'

export default async function UserPage({params}: {params:{id: string}}) {
    const user = await getUser()
    console.log(user)
    const userPosts = await getUserPosts(params.id)
    console.log(userPosts)
  return (
    <div>
      <div className="display: flex flex-col overflow-y-scroll border-l border-r border-green-500">
          {!userPosts? <span/> : 
              userPosts.map((post, index) => (
                  <div className='display: flex flex-col m-auto mt-3 mb-3 border border-green-500 w-[80%] h-40'>{post.content}</div>
              ))
          }
      </div>
      <div>
        <form action={async (formData: FormData) =>{
          'use server'
          if(user !== params.id){
            await sendFriendRequest(user, params.id)
          }
        }}>
          <Button type="submit">Add Friend</Button>
        </form>
      </div>
    </div>
  )
}
