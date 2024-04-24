import { article } from "@/app/lib/interface";
import { client, urlFor } from "@/app/lib/sanity";
import { PortableText } from "next-sanity";
import Image from "next/image";

async function getData(slug: string){
    const query = `
  *[_type == "blog" && slug.current == '${slug}'] | order(_createdAt asc){
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
        <div className="w-[100vw] content-center flex-auto">

          <h1 className="text-3xl font-extrabold text-center">{data.title}</h1>
            <Image
              src={urlFor(data.heroImage).url()}
              alt={data.currentSlug}
              width={1920}
              height={500}
              className="w-[800px] h-[600px] rounded-lg m-[auto] object-cover border-4 border-violet-600"
            />
            <div className="mt-24 prose m-[auto] prose-violet prose-xl dark:prose-invert prose-h:text-primary">
              <PortableText value={data.content}/>
            </div>
        
        </div>
    )
}