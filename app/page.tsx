import Link from "next/link";
import Image from "next/image";
import styles from "./sass/components/Container.module.scss"
import { client, urlFor } from "./lib/sanity";
import { blogCard } from "./lib/interface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ButtonWrapper from "./components/button/Button";

export const revalidate = 30

//fetch the data for blog posts from sanity.io
async function getPosts() {
  const query = `
  *[_type == "blog"] | order(_createdAt asc){
    title,
      smallDescription,
      "currentSlug": slug.current,
      heroImage
  }
  `;

  const data = await client.fetch(query)
  return data
}

export default async function Home() {
  const data: blogCard[] = await getPosts()
  console.log(data)
  return (
    <div>
      <div className={styles.pageContainer}>
        <div className='grid grid-cols-1 md:grid-cols-2 mt-5 gap-5'>
          {data.map((post, idx) =>(
            <Card key={idx}>
              <Image 
              src={urlFor(post.heroImage).url()} 
              alt="image" 
              width={200} 
              height={200}
              className="rounded-t-lg h-[300px] w-[100%] object-cover"
              />
              <CardContent className="mt-5">
                <h3 className="text-xl line-clamp-2 font-bold">{post.title}</h3>
                <p className="line-clamp-3 text-sm text-violet-500 mt-5">{post.smallDescription}</p>
              </CardContent>
              <Button asChild className="w-[50%] mt-7 mb-7 ml-[25%]">
                <Link href={`/blog/${post.currentSlug}`}>Read More</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
