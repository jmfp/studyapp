import React from "react";
import Link from "next/link";
import { ModeToggle } from "../../button/ModeToggle";
import Logo from "../../logo/Logo";
//import Logo from "../../logo";
//import Button from "../../button";
import { PiGithubLogoThin, PiLinkedinLogoThin } from "react-icons/pi";

const NavBar = () =>{
    return(
    <>
    <div className="w-full h-20 lg:sticky top-0">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          <Logo/>
          <Link href="/projects">Projects</Link>
          <SocialLinks/>
        </div>
      </div>
    </div>
  </>
    );
};

function SocialLinks(){
  return(
    <div className="flex items-center gap-2">
      <Link
        href="https://github.com/jmfp"
        target="_blank"
      ><PiGithubLogoThin size={42}/></Link>
      <Link
        href="https://www.linkedin.com/in/jessie-price-629167245/"
        target="_blank"
      ><PiLinkedinLogoThin size={42}/></Link>
      <ModeToggle/>
    </div>
  )
  
}

export default NavBar;