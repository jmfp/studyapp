import { addCharacter } from "@/actions/actions"
import { Button } from "@/components/ui/button"
import { FormEvent } from "react"

export default async function NewCharacter() {
  async function submit(e: FormEvent){
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    console.log(formData);
  }

const formData = new FormData()
  return (
    <div>
        <form name="form1" action={async () =>{
                'use server'
                await submit()
                //await deleteBlog
            }}>
            <input placeholder="characterName" name="characterName"/>
            <Button type="submit">Add</Button>
        </form>
    </div>
  )
}
