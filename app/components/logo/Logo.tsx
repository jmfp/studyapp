import React from "react";
import Link from "next/link";
//import Logo from "../../logo";
//import Button from "../../button";

const Logo = () =>{
    return(
        <div className="prose-2xl">
        <Link
          href="/"
        >
          <p>JesseThe{"["}<span className="text-violet-500">Dev</span>{"]"}</p>
        </Link>
        </div>
    );
};

export default Logo;