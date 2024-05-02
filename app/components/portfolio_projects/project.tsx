import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

interface data {
    image: string;
    link: string;
    description: string;
}

export default function Project(props: data){
    return(
        <div>
            <Card className="h-[500px]">
                <Image
                    src={props.image}
                    alt="web development"
                    width={200}
                    height={200}
                    className="rounded-t-lg h-[300px] w-[100%] object-cover"
                />
                <CardContent className="mt-5 text-center">
                    <p className="text-sm text-violet-500 mt-5">{props.description}</p>
                </CardContent>
                <Button asChild className="w-[50%] bottom-5 ml-[25%]">
                    <Link href={props.link} target="_blank">Check Out</Link>
                </Button>
            </Card>
        </div>
    )
}