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

export interface post{
    friendId: string,
    pic: string,
    content: string,
    pictures: string,
    likes: []
}