'use server'

import { getCourses } from "@/actions/actions"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function Dashboard() {
    const courses = await getCourses()
    console.log(courses)
  return (
    <div>
        <div>
            {!courses? <span/> :
                courses.map((course: any, index: number) => (
                    <div>
                        <p>{course.course_name}</p>
                        <form action={async () =>{
                            'use server'
                            redirect(`/admin/course/edit/${course.id}`)
                            //await addCourse()
                        }}>
                            <Button type="submit">Edit</Button>
                        </form>
                    </div>
                ))
            }
        </div>
        <form action={async () =>{
            'use server'
            //redirect("/")
        }}>
            <Button type="submit">Create New Course</Button>
        </form>
    </div>
  )
}
