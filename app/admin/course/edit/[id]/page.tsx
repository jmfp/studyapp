import { Button } from '@/components/ui/button'
import React from 'react'

export default function EditCourse({params}:{params: {id: String}}) {
    let answers = []
  return (
    <div>
        <form action={async (formData: FormData) =>{
            'use server'
        }}>
            <textarea name='information' placeholder='Information'/>
            <textarea name='question' placeholder='Question'/>
            <Button type="submit">Add</Button>
        </form>
    </div>
  )
}
