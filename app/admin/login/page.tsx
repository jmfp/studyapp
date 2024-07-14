import { login, logout } from "@/app/auth/auth"
import { redirect } from "next/navigation"

export default async function Login(){
    return(
        <div className="flex-col m-auto items-center h-full border-l-2 rounded-sm ">
            <div>
                <form action={async (formData) =>{
                    'use server'
                    await login(formData)
                    redirect('/admin/dashboard')
                }} method="post">
                    <label htmlFor="email">Email</label>
                    <input name="email"/>
                    <label htmlFor="password">password</label>
                    <input type='password' name="password"/>
                    <button>Sign In</button>
                </form>
                <form action={async () =>{
                    'use server'
                    await logout()
                    redirect('/')
                }}>
                    <button type='submit'>Log Out</button>
                </form>
            </div>
        </div>
    )
}