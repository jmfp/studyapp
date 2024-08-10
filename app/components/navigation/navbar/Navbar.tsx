import React from "react";
import Link from "next/link";
import { ModeToggle } from "../../button/ModeToggle";
import Logo from "../../logo/Logo";
import { VscBell } from "react-icons/vsc";
import { getFriendRequest, getUser, getUserObject } from "@/actions/actions";

const NavBar = async () =>{
    return(
    <>
    <div className="w-full h-20 top-0 z-50">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          <Logo/>
          <SocialLinks/>
        </div>
      </div>
    </div>
  </>
    );
};

async function SocialLinks(){
  
  const user = await getUser()
  console.log(`user is ${user}`)
  const userObject = await getUserObject(user)
  //TODO: add list and schema for notificationo type on the database that are just a string of notifications for a current user
  const friendRequests = await getFriendRequest(user)
  console.log(friendRequests)
  return(
    <div className="flex items-center gap-2">
      {!user ? <span/> : 
        <Link href={`/user/${user}/notifications`}>
          <div className="display: flex ">
          <VscBell className="h-6 w-6 static">
          </VscBell>
          {friendRequests?.length !==0 ?
            <div className="bg-red-500 rounded-full h-2 w-2 static"/>
          :
            <span className="h-2 w-2 static"/>
          }
          </div>
        </Link>
      }
      <ModeToggle/>
    </div>
  )
  
}

export default NavBar;