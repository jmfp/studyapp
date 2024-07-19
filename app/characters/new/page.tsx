import { addCharacter, get5eAlignments, get5eBackgrounds, get5eClasses, get5eRaceAttributes, get5eRaces, getUser } from "@/actions/actions"
import { getSession } from "@/app/auth/auth"
import { Button } from "@/components/ui/button"
import { PrismaClient } from "@/prisma/generated/client"
import { FormEvent } from "react"

export default async function NewCharacter() {
    

const formData = new FormData()
const classes = await get5eClasses()
const races = await get5eRaces()
const backgrounds = await get5eBackgrounds()
const alignments = await get5eAlignments()
let languages = {languages: []}
let proficiencies = {proficiencies: []}
let equipment = [{equipment: []}]

let prisma = new PrismaClient()

async function getChoices(race: string){
    const res = await get5eRaceAttributes(race)
    console.log(res)
    return res
}

async function add(data: FormData){
    console.log(data)
    //addCharacter(data)
}
getChoices("elf")
console.log(alignments)
  return (
    <div className="display: flex flex-col">
        <form className="display: flex m-auto flex-col w-[80%] gap-4" name="form1" action={async (formData: FormData) =>{
                'use server'
                const sess = await getSession()
                formData.append("user", `${await getUser(sess.user.email)}`)
                console.log(formData)
                await addCharacter(formData)
            }}>
            <p>Character Name</p>
            <input placeholder="characterName" name="characterName"/>
            <p>Character Class</p>
            <select name="pclass">
                {!classes.results? 
                    <option value="Na">NA</option>
                :
                    classes.results.map((classes: any, idx: any)=>(
                        <option value={classes.name}>{classes.name}</option>
                    ))
                }
            </select>
            <p>Character Race</p>
            <select name="race">
                {!races.results? 
                    <option value="Na">NA</option>
                :
                    races.results.map((races: any, idx: any)=>(
                        <option value={races.name}>{races.name}</option>
                    ))
                }
            </select>

            <p>Character Background</p>
            <select name="background">
                {!backgrounds.results? 
                    <option value="Na">NA</option>
                :
                backgrounds.results.map((backgrounds: any, idx: any)=>(
                        <option value={backgrounds.name}>{backgrounds.name}</option>
                    ))
                }
            </select>
            <p>Character Backstory</p>
            <textarea name="backstory" />
            <Button type="submit">Add</Button>
        </form>
    </div>
  )
}
