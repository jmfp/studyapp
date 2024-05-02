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
            <Card>
                <Image
                    src={props.image}
                    alt="web development"
                    width={200}
                    height={200}
                />
                <CardContent>
                    {props.description}
                </CardContent>
                <Button asChild>
                    <Link href={props.link}>Check Out</Link>
                </Button>
            </Card>
        </div>
    )
}