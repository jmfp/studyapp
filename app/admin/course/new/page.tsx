import { addCourse } from "@/actions/actions"
import { Button } from "@/components/ui/button"

export default function NewCourse() {
  return (
    <div>
        <form action={async (formdata: FormData) =>{
            'use server'
            await addCourse(formdata)
        }}>
            <input name="course_name" placeholder="Course Name"/>
            <Button type="submit">Add Course</Button>
        </form>
    </div>
  )
}
