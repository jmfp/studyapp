import { article } from "@/app/lib/interface";
import { client, urlFor } from "@/app/lib/sanity";
import { PortableText } from "next-sanity";
import Image from "next/image";

async function getData(slug: string){
    const query = `
  *[_type == "blog" && slug.current == '${slug}'] | order(_createdAt desc){
    title,
      "currentSlug": slug.current,
      heroImage,
      content
  }[0]
  `;

  const data = await client.fetch(query)
  return data
}

export default async function Article({params}:{params: {slug: string}}){
    const data: article = await getData(params.slug)
    console.log(data)
    return(
        <div>

            <Image
              src={urlFor(data.heroImage).url()}
              alt={data.currentSlug}
              width={1920}
              height={500}
            />
        <h1>{data.title}</h1>
          <div>
            <PortableText value={data.content}/>
          </div>
        </div>
    )
}