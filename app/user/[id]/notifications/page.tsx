import { decideFriendRequest, getFriendRequest, getUser, getUserObject } from "@/actions/actions"
import { Button } from "@/components/ui/button"

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
                friendRequests.map((request: any, idx: number) =>(
                    <div key={idx} className="display: flex border border-green-400 rounded-lg">
                        <div>
                            <p>{`${request.userId} sent a friend request`}</p>
                        </div>
                        <form action={async () => {
                            'use server'
                            await decideFriendRequest(true, request.id)
                        }}>
                            <Button type="submit">Confirm</Button>
                        </form>
                        <form action={async () => {
                            'use server'
                            await decideFriendRequest(false, request.id)
                        }}>
                            <Button type="submit">Deny</Button>
                        </form>
                    </div>
                ))
            }
        </div>
    </div>
  )
}
