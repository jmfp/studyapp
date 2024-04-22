import Link from "next/link";
import Image from "next/image";
import styles from "./sass/pages/Home.module.scss"
import { client, urlFor } from "./lib/sanity";
import { blogCard } from "./lib/interface";
import { Card } from "@/components/ui/card";

//fetch the data for blog posts from sanity.io
async function getPosts() {
  const query = `
  *[_type == "blog"] | order(_createdAt desc){
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
      <Image
        className={styles.header}
        src='https://images.unsplash.com/photo-1547916721-7469af15e2a3?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        width={1920}
        height={500}
        alt='cleveland web design'
      />
      <h1>Hello, Next.js!</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 mt-5 gap-5'>
        {data.map((post, idx) =>(
          <Card key={idx}>
            <Image 
            src={urlFor(post.heroImage).url()} 
            alt="image" 
            width={200} 
            height={200}
            className="rounded-t-lg h-[200px] object-cover"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
