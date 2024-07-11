
import Markdown from "react-markdown"
import parse from 'html-react-parser'
import rehypeHighlight from "rehype-highlight"
import { cn } from "@/lib/utils"
import 'highlight.js/styles/base16/pop.css'
import { PiTerminalThin } from "react-icons/pi"
import Copybutton from "../button/Button"
import { icons } from "@/app/lib/languageicons"

export default function MarkdownArea({content, children, className}:{content:string, children?:any, className?:string}) {
  return (
    <Markdown 
    rehypePlugins={[rehypeHighlight]}
    className={cn(" space-y-6", className)}
    components={{
        h1:({node, ...props}) =>{
            return <h1 {...props}/>
        },
        code:({node, className, children, ...props}) =>{
            const match = /language-(\w+)/.exec(className || "")
            const id = (Math.floor(Math.random() * 100) + 1).toString()
            if(match?.length){
                let Icon = PiTerminalThin
                const isMatch = icons.hasOwnProperty(match[1])
                if(isMatch){
                    Icon = icons[match[1] as keyof typeof icons]
                }
                return <div className="bg-gradient-to-b text-gray-300 border rounded-md">
                    <div className='px-5 py-2 border-b flex items-center justify-between'>
                        <div className="flex items-center gap-2">
                            <Icon/>
                            <span>{
                                //@ts-ignore
                                node?.data?.meta
                            }</span>
                        </div>
                        <Copybutton id={id}></Copybutton>
                    </div>
                    <div className='overflow-x-auto w-full '>
                        <div className='p-5' id={id}>
                            {children}
                        </div>
                    </div>
                </div>
            }
            return <code>{children}</code>
        }
    }}
    
    >{content}</Markdown>
  )
}
