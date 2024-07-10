'use client'
import {BsCopy} from 'react-icons/bs'

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
