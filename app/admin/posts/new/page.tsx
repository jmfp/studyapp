'use client'

import RichText from "@/app/components/text/RichText";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button";

export default function AddPost(){

    const formSchema = z.object({
        title: z.string().min(5, {message: 'Minimum title of 5 characters'}),
        image: z.string().min(1, {message: 'Image is required'}),
        slug: z.string().min(1, {message: 'slug is required'}),
        description: z.string().min(2, {message: 'description is required'}),
        content: z.string().min(1, {message: 'content is required'})
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues:{
            title: '',
            image: '',
            slug: '',
            description: '',
            content: ''
        }
    })

    function onSubmit(values: z.infer<typeof formSchema>){
        fetch('/api/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
          })
        //submit data to the backend too be stored in the database
    }

    function generateSlug(articleTitle: string){
        if(articleTitle !== ''){
            articleTitle.replace(/ /g,"-")
        }
    }

    return(
        <div>
            <main className="p-24">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                        control={form.control}
                        name="image"
                        render={({field}) =>(
                            <FormItem>
                                <FormLabel>Image</FormLabel>
                                <FormControl>
                                    <Input placeholder="Article Image Url" {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="title"
                        render={({field}) =>(
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Article Title" {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="slug"
                        render={({field}) =>(
                            <FormItem>
                                <FormLabel>Slug</FormLabel>
                                <FormControl>
                                    <Input placeholder="Article Slug" {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({field}) =>(
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <RichText description={field.name} onChange={field.onChange}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="content"
                        render={({field}) =>(
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                    <RichText description={field.name} onChange={field.onChange}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Button type='submit'>Submit</Button>
                </form>
            </Form>
            </main>
        </div>
    )
}