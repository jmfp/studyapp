import { redirect } from "next/navigation";
import { ClientButton } from "../components/button/Button";
import { Button } from "@/components/ui/button";

export default function Campaigns() {
  return (
    <div>Campaigns
        <form action={async()=>{
            'use server'
            await redirect("/campaign/new")
        }}>
            <Button type="submit">New Campaign</Button>
        </form>
    </div>
  )
}
