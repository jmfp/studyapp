import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { blogPost } from '../interface'
//import { supabase } from '../db/supabase'
import { Database } from '@/lib/types/supabase'

const cookieStore = cookies()

const supabase = createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
    },
  }
)

export async function createBlog(data: blogPost){
    const {["content"]:excludedKey, ...blog} = data

    const result = await supabase.from("blog").insert(blog).select("id").single()

    if(result.error){
        return JSON.stringify(result)
    }

    const blogContent = await supabase.from("blog_content").insert({blog_id:result.data.id!, content:data.content})
    return JSON.stringify(blogContent)
} 