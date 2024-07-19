import { Button } from "@/components/ui/button"

export default function page() {
  return (
    <div className="display: flex flex-col w-full h-full">
        <div className="display: flex m-auto p-6 w-[25%] flex-col items-center border border-green-400 rounded-lg">
            <h1 className="bold text-green-400">$5.99/mo</h1>
            <ul>
                <li>5 Characters</li>
                <li>Campaign Tools</li>
            </ul>
            <form action={async () =>{
                'use server'
                console.log("implement stripe")
            }}>
                <Button type="submit">Subsribe</Button>
            </form>
        </div>
    </div>
  )
}
