'use client'

import Image from "next/image";
import {Parallax, ParallaxBanner} from 'react-scroll-parallax'

export default function ParallaxImage(props: {image: string, alt:string, width:number, height:number, style:string, text:string}){
    return(
        <ParallaxBanner layers={[{ image: props.image, speed: -20 }]} className="aspect-[2/1] object-cover z-0 items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center m-[auto]">
                <h1 className="text-8xl text-white font-thin text-center">{props.text}</h1>
            </div>
        </ParallaxBanner>
    )
}