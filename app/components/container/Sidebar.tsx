import { getSuggestedUsers, getUser, getUserFriends, sendFriendRequest } from '@/actions/actions'
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default async function SuggestedFriends() {
    const userId = await getUser()
    const users = await getSuggestedUsers()
    const friends = await getUserFriends(userId)
    console.log(friends)
  return (
    <div className={`display: flex flex-col border rounded-lg mr-6 h-full w-[25%] max-sm:hidden`}>
        <h1 className='text-primary ml-2'>Suggested Friends</h1>
        <div>
            {!users ? <span/> : 
                users.map((user: any, idx: number) => (
                    <div className="display: flex m-3 text-center">
                        <Image src={user.profilePic}
                        width={200}
                        height={200}
                        alt={`${user.username}'s Profile Picture`}
                        className='border rounded-full border-primary w-12 h-12 object-cover'
                        />
                        <p className="text-primary m-auto">{user.username}</p>
                        <form action={async () =>{
                            'use server'
                            await sendFriendRequest(userId, user.id)
                        }}>
                            {friends?.includes(user.id) ? <span className="w-12"/>:
                                <Button type='submit'>Add</Button>
                            }
                        </form>
                    </div>
                ))
            }
        </div>
    </div>
  )
}
