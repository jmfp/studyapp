import { Button } from "@/components/ui/button"
import { getSession, login, logout } from "../auth/auth"
import Link from "next/link"

export default async function SignIn() {
    const session = await getSession()

  return (
    <div className="display: flex flex-col items-center justify-center">
        {!session ? 
            <form className="display: flex flex-col m-auto border border-primary rounded-lg w-[80%] h-full p-6 gap-2" action={async (formData: FormData) => {
                'use server'
                await login(formData)
            }}>
                <input name="email" type="email" placeholder="E-mail"/>
                <input name="password" type="password" placeholder="Password"/>
                <Button type="submit">Sign In</Button>
                <div className="display: flex m-auto">
                    <p>{`No Account? `}</p> 
                    <a href={"/signup"} className="text-primary"> Sign Up</a>
                </div>
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
