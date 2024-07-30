'use client'
import {BsCopy} from 'react-icons/bs'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from '@/components/ui/button'

export default async function Copybutton({id}:{id:string}) {
    const handleCopy = async () =>{
        const text = document.getElementById(id)?.textContent
        try {
            await navigator.clipboard.writeText(text!)
        } catch (error) {
            console.log(error)
        }
    }
  return (
    <div onClick={handleCopy} className='p-2 hover:scale-105 cursor-pointer hover:bg-gray-100 rounded-md'>
        <BsCopy/>
    </div>
  )
}

export async function ClientButton(text: string, func: any){
    <Button type='button' onClick={(e) => func(e)}>{text}</Button>
}


export function CheckboxWithText() {
  return (
    <div className="items-top flex space-x-2">
      <Checkbox id="terms1" />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor="terms1"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Accept terms and conditions
        </label>
        <p className="text-sm text-muted-foreground">
          You agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
