import { Button } from "@/components/ui/button"
import { getSession, login, logout } from "../auth/auth"

export default async function SignIn() {
    const session = await getSession()

  return (
    <div className="display: flex flex-col items-center justify-center">
        {!session ? 

            <form className="display: flex flex-col m-auto border border-green-400 rounded-lg w-[80%] h-full p-6 gap-2" action={async (formData: FormData) => {
                'use server'
                await login(formData)
            }}>
                <input name="email" type="email" placeholder="E-mail"/>
                <input name="password" type="password" placeholder="Password"/>
                <Button type="submit">Sign In</Button>
            </form>
        :
            <form action={async (formData: FormData) => {
                'use server'
                await logout()
            }}>
                <Button type="submit">Logout</Button>
            </form>
        }
    </div>
  )
}
