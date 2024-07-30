import { getUserPosts } from '@/actions/actions'
import React from 'react'

export default async function UserPage({params}: {params:{id: string}}) {
    const userPosts = await getUserPosts(params.id)
    console.log(userPosts)
  return (
    <div className="display: flex flex-col overflow-y-scroll border-l border-r border-green-500">
        {!userPosts? <span/> : 
            userPosts.map((post, index) => (
                <div className='display: flex flex-col m-auto mt-3 mb-3 border border-green-500 w-[80%] h-40'>{post.content}</div>
            ))
        }
    </div>
  )
}
