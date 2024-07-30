
import { signUp } from "@/actions/actions"
import { Button } from "@/components/ui/button"

export default function NewUser() {
  return (
    <div>
        <form action={async(formData: FormData) =>{
            'use server'
            await signUp(formData)
        }}>
            <input placeholder="UserName" name="username"/>
            <input placeholder="E-mail" name="email"/>
            <input placeholder="Password" name="password"/>
            <Button type="submit">Signup</Button>
        </form>
    </div>
  )
}
