import { Button } from "@/components/ui/button"
import { login } from "../auth/auth"

export default function SignIn() {
  return (
    <div>
        <form action={async (formData: FormData) => {
            'use server'
            await login(formData)
        }}>
            <input name="email" type="email" placeholder="E-mail"/>
            <input name="password" type="password" placeholder="Password"/>
            <Button type="submit">Sign In</Button>
        </form>
    </div>
  )
}
