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
          <p>Social<span className="text-primary">Site</span></p>
        </Link>
        </div>
    );
};

export default Logo;