export interface blogCard{
    title: string,
    smallDescription: string,
    currentSlug: string,
    heroImage: any
}

export interface article{
    title: string,
    currentSlug: string,
    heroImage: any,
    content: any
}

export interface blogPost{
    title: string,
    image_url: string,
    is_published: boolean,
    slug: string,
    content: string
}