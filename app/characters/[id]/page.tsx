import { get5eBackgrounds, get5eClasses, get5eLanguages, get5eRaceAttributes, get5eRaces, getCharacters, getUser } from "@/actions/actions"
import { getSession } from "@/app/auth/auth"
import { ClientButton } from "@/app/components/button/Button"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function CharacterSheet({params} : {params: {id: string}}) {
    //verifying user is logged in
    const user = await getSession()
    if(!user){
        redirect("/signin")
    }
    const userObject = await getUser(user.user.email)
    const character = await getCharacters(userObject.id, params.id)
    //get race attributes to choose from if char not finished
    const raceAttributes = await get5eRaceAttributes(character[0].race)
    //gets all languages for user to choose from
    const allLanguages = await get5eLanguages()
    //getting the details for the characters class
    const pclass = await get5eClasses(character[0].pclass.toLowerCase())
    //getting choices related to background
    const background = await get5eBackgrounds(character[0].background.toLowerCase())
    console.log(background)
    let extra = {
        ability_bonuses: 0
    }
    //TODO: remove already existing proficiencies from choices before finishing character
    //console.log(pclass.proficiency_choices[0])
    //console.log(pclass.starting_equipment_options)
  return (
    <div>
        {!character ? <span/> : 
            <div>
                <p>{character[0].name}</p>
                <form action={async (formData: FormData) =>{
                    'use server'
                    console.log(formData)
                    //update char and finish in database
                }}>
                    <p>{character[0].race}</p>
                    <p>Languages</p>
                    {!allLanguages.results ? <span/> :
                        allLanguages.results.map((language: any, idx: number) =>(
                            <div>
                                <input type="checkbox" id={language.index} name="languages" value={`${language.name}`}/>
                                <label htmlFor={language.index}>{` ${language.name}`}</label>
                            </div>
                        ))
                    }
                    <p>{pclass.proficiency_choices[0].desc}</p>
                    {!pclass ? <span/> :
                        pclass.proficiency_choices[0].from.options.map((choice: any, idx: number) =>(
                            <div>
                                <input type="checkbox" id={choice.item.index} name="proficiencies" value={`${choice.item.index}`}/>
                                <label htmlFor={choice.item.index}>{` ${choice.item.name}`}</label>
                            </div>
                        ))
                    }
                    <Button type="submit">Finish</Button>
                </form>
            </div>
        }
    </div>
  )
}
