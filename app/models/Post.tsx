import mongoose, { Document, Schema } from 'mongoose'

export interface IPost extends Document{
    title: string,
    image: string,
    slug: string,
    description: string,
    content: string
}

const postSchema:Schema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
})

const Post = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema)

export default Post