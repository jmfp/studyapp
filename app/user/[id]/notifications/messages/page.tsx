import { sendMessage } from '@/actions/actions'
import { Button } from '@/components/ui/button'
import React from 'react'

export default async function NewMessage() {
  return (
    <div>
        <form action={async (formdata: FormData) => {
            'use server'
            await sendMessage( "", "", `${formdata.get("content")}`)
        }}>
            <textarea name='content' placeholder='Write Message'/>
            <Button type="submit">Send</Button>
        </form>
    </div>
  )
}
