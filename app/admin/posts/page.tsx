import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminPosts(){
    return(
        <div>
            <p>All Posts</p>
            <Button asChild>
                <Link href="/admin/posts/new">Add Post</Link>
            </Button>
        </div>
    )
}