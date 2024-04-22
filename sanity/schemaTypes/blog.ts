export default{
    name: "blog",
    type: "document",
    title: "Blog",
    fields: [
        {
            name: "title",
            type: "string",
            title: "Title of article"
        },
        {
            name: "slug",
            type: "slug",
            title: "Article Slug",
            options: {
                source: 'title'
            }
        },
        {
            name:"heroImage",
            type: "image",
            title: "Hero Image"
        },
        {
            name: "smallDescription",
            type: "text",
            title: "Small description of article"
        },
        {
            name: "content",
            type: "array",
            title: "Article Content",
            of: [
                {
                    type: "block"
                }
            ]
        }
    ]
}