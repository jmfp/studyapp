import { get5eRaceAttributes, getCharacters, getUser } from "@/actions/actions"
import { getSession } from "@/app/auth/auth"
import { redirect } from "next/navigation"

export default async function CharacterSheet({params} : {params: {id: string}}) {
    const user = await getSession()
    if(!user){
        redirect("/signin")
    }
    const userObject = await getUser(user.user.email)
    const character = await getCharacters(userObject.id, params.id)
    //get race attributes to choose from
    const raceAttributes = await get5eRaceAttributes(character[0].race)
    console.log(raceAttributes)
  return (
    <div>
        {!character ? <span/> : 
            <div>
                <p>{character[0].name}</p>
                <form action={async (formData: FormData) =>{
                    'use server'

                }}>
                    <p>{character[0].race}</p>
                </form>
            </div>
        }
    </div>
  )
}
