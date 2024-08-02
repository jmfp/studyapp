import { decideFriendRequest, getFriendRequest, getUser } from "@/actions/actions"
import { Button } from "@/components/ui/button"

export default async function Notifications({params} : {params:{id: string}}) {
    //const user = getUser()
    const friendRequests = await getFriendRequest(params.id)
    console.log(`id is ${params.id}`)
  return (
    <div>
        <div className="display: flex flex-col h-[vh] w-[vw]">
            {!friendRequests?<span/>:
                friendRequests.map((request: any, index: number) =>(
                    <div className="display: flex border border-green-400 rounded-lg">
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
