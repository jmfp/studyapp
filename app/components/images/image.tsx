import { ReactNode } from "react";

export async function ParallaxHero(props:{image: string, height: number, children?: ReactNode, style?: string}) {
    return(
        <div className={`h-full`}>
            <div
            className={`relative h-0 w-full bg-cover mb-3 bg-center bg-fixed bg-no-repeat`}
            style={{
              backgroundImage: `url(${props.image})`,
              paddingTop: `${props.height}%`
            }}
        >
            <div className={`absolute lg:top-64 sm:top-6 md:top-6 ${props.style}`}>
                {props.children}
            </div>
        </div>
            
        </div>
    )
}