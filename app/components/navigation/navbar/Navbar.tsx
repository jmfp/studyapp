import React from "react";
import Link from "next/link";
import { ModeToggle } from "../../button/ModeToggle";
import Logo from "../../logo/Logo";
//import Logo from "../../logo";
//import Button from "../../button";
import { PiGithubLogoThin, PiLinkedinLogoThin } from "react-icons/pi";
import { VscBell } from "react-icons/vsc";
import { getUser } from "@/actions/actions";
import { getSession } from "@/app/auth/auth";

const NavBar = async () =>{
    return(
    <>
    <div className="w-full h-20 lg:sticky top-0 z-50">
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
  console.log(user)
  return(
    <div className="flex items-center gap-2">
      {!user ? <span/> : 
        <Link href={`/user/${user}/notifications`}>
          <VscBell/>
        </Link>
      }
      <ModeToggle/>
    </div>
  )
  
}

export default NavBar;