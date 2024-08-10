import { decideFriendRequest, getFriendRequest, getUser, getUserObject } from "@/actions/actions"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default async function Notifications({params} : {params:{id: string}}) {
    //const user = getUser()
    const friendRequests = await getFriendRequest(params.id)
    let requests: any = []
    //friendRequests.map(async(request: any, idx: number) =>(
    //    requests.push(await getUserObject(request.userId))
    //))
    //console.log(requests)
  return (
    <div>
        <div className="display: flex flex-col h-[vh] w-[vw]">
            {!friendRequests?<span/>:
                friendRequests.map(async (request: any, idx: number) =>{
                    const userObject = await getUserObject(request.userId)

                    return(
                    <div key={idx} className="display: flex border border-primary rounded-lg">
                        <div className="flex flex-row justify-evenly m-auto">
                            <Image 
                                src={`${userObject?.profilePic}`}
                                alt=""
                                width={200}
                                height={200}
                                className="h-12 w-12 rounded-full border border-primary m-3"
                            />
                            <p className="m-auto">{`${userObject?.username} sent a friend request`}</p>
                        </div>
                        <form className="m-auto" action={async () => {
                            'use server'
                            await decideFriendRequest(true, request.id)
                        }}>
                            <Button type="submit">Confirm</Button>
                        </form>
                        <form className="m-auto" action={async () => {
                            'use server'
                            await decideFriendRequest(false, request.id)
                        }}>
                            <Button type="submit">Deny</Button>
                        </form>
                    </div>
                    )
                })
            }
        </div>
    </div>
  )
}
