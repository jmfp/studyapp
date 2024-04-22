import React from "react";
import Link from "next/link";
import { ModeToggle } from "../../button/ModeToggle";
//import Logo from "../../logo";
//import Button from "../../button";

const NavBar = () =>{
    return(
        
    <>
    <div className="w-full h-20 sticky top-0">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          <ul className="hidden md:flex gap-x-6 text-white">
            <li>
              <Link href="/">
                <p>Home</p>
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <p>Contact</p>
              </Link>
            </li>
            <li>
              <Link href="/projects">
                <p>Projects</p>
              </Link>
            </li>
          </ul>
          <ModeToggle/>
        </div>
      </div>
    </div>
  </>
    );
};

export default NavBar;