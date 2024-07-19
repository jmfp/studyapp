import { deleteCharacter, getCharacters, getUser } from "@/actions/actions"
import { getSession } from "../auth/auth"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function Characters() {
    const user = await getSession()
    if(!user){
        redirect("/admin/login")
    }
    const userObject = await getUser(user.user.email)
    const characters = await getCharacters(userObject.id)
    //const characters = await getCharacters(user.id)
  return (
    <div className="display: flex flex-col items-center">
        <h1>All Characters</h1>
        <div className="display: flex-col justify-evenly border mt-6 gap-6 border-green-400 rounded-lg m-auto w-[80%] h-[750px] p-6 overflow-y-scroll">
            {characters.map((character: any, idx: number) => (
                <div className="display: flex justify-evenly text-center items-center text-green-400 m-auto border mt-6 border-green-400 rounded-lg h-[250px]">
                    <p className="text-white">Character</p> {character.name}
                    <p className="w-[60%]">{character.backstory}</p>
                    <div className="w-[20%]">
                        <form action={async () =>{
                            'use server'
                            await deleteCharacter(character.id)
                        }}>
                            <Button type="submit">Delete</Button>
                        </form>
                    </div>
                </div>
            ))}
        </div>
        <div className="mt-6">
            <form action={async () =>{
                'use server'
                redirect('/characters/new')
            }}>
                <Button type="submit">Create New</Button>
            </form>
        </div>
    </div>
  )
}
