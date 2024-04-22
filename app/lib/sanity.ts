//a sanity client to connect to the sanity backend and send queries
import { createClient } from "next-sanity";
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
    apiVersion: '2023-05-03',
    dataset: 'production',
    projectId: '8qh3jf19',
    useCdn: false,
})

const imageBuilder = imageUrlBuilder(client)

export function urlFor(source: any){
    return imageBuilder.image(source);
}