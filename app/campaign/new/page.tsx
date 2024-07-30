
export default function NewCampaign() {
  return (
    <div className="display: flex flex-col">NewCampaign
        <div className="flex-col ">
            <form action={async () =>{
                'use server'
            }}>
                <input name="name" placeholder="campaign name"></input>
                
            </form>
        </div>
    </div>
  )
}
