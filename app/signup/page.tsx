import { signUp } from "@/actions/actions";
import { Button } from "@/components/ui/button";

export default function Signup() {
    const formData = new FormData();
  return (
    <div className="display: flex flex-col justify-center items-center h-screen">
        <div className="display: flex flex-col w-[60%] m-auto h-[500px] gap-6 justify-evenly border border-primary rounded-sm">
            <form className="display: flex justify-space-between gap-4 w-[80%] m-auto flex-col" action={async(formData: FormData)=>{
                'use server'
                await signUp(formData)
            }}>
                <h1>Signup</h1>
                <input name="email" placeholder="E-mail" type="email" className='text-primary '/>
                <input name="password" placeholder="Password" type="password" className='text-primary'/>
                <input name="username" placeholder="Username" className='text-primary'/>
                <Button type="submit">Signup</Button>
            </form>
        </div>
        <div className="display: flex m-auto">
            <p>Already have an account? </p>
            <a className="text-primary" href="/signin">{` Sign In`}</a>
        </div>
    </div>
  )
}
