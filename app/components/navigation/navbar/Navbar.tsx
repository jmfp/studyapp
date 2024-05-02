import React from "react";
import Link from "next/link";
import { ModeToggle } from "../../button/ModeToggle";
import Logo from "../../logo/Logo";
//import Logo from "../../logo";
//import Button from "../../button";

const NavBar = () =>{
    return(
        
    <>
    <div className="w-full h-20 lg:sticky top-0">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          <Logo/>
          <ModeToggle/>
        </div>
      </div>
    </div>
  </>
    );
};

export default NavBar;