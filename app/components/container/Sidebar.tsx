import { getSuggestedUsers, getUser, sendFriendRequest } from '@/actions/actions'
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default async function SuggestedFriends() {
    const userId = await getUser()
    const users = await getSuggestedUsers()
  return (
    <div className={`display: flex flex-col border rounded-lg lg:w-[20%] m-3`}>
        <h1 className='text-primary ml-2'>Suggested Friends</h1>
        <div>
            {!users ? <span/> : 
                users.map((user: any, idx: number) => (
                    <div className="display: flex m-3 text-center">
                        <Image src={user.profilePic}
                        width={200}
                        height={200}
                        alt={`${user.username}'s Profile Picture`}
                        className='border rounded-full border-green-400 w-12 h-12 object-cover'
                        />
                        <p className="text-primary m-auto">{user.username}</p>
                        <form action={async () =>{
                            'use server'
                            await sendFriendRequest(userId, user.id)
                        }}>
                            <Button type='submit'>Add</Button>
                        </form>
                    </div>
                ))
            }
        </div>
    </div>
  )
}
