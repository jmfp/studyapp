'use client'

import Image from "next/image";
import {Parallax, ParallaxBanner} from 'react-scroll-parallax'
import { ReactNode } from "react";

export default function ParallaxImage(props: {image: string, alt:string, width:number, height:number, style:string, text:string}){
    return(
        <ParallaxBanner layers={[{ image: props.image, speed: -20 }]} className="aspect-[2/1] object-cover z-0 items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center m-[auto]">
                <h1 className="text-8xl text-white font-thin text-center">{props.text}</h1>
            </div>
        </ParallaxBanner>
    )
}

export async function ParallaxHero(props:{image: string, height: number, children?: ReactNode, style?: string}) {
    return(
        <div className={`h-${props.height}`}>
            <div
            className={`relative h-[${props.height}px] w-full bg-cover mb-3 bg-center bg-fixed bg-no-repeat`}
            style={{
              backgroundImage: `url(${decodeURI(props.image)})`,
            }}
        >
            <div className={`${props.style}`}>
                {props.children}
            </div>
        </div>
            
        </div>
    )
}