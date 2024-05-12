'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { Bold,
         Strikethrough,
         Italic,
         Code,
         Image,
         List,
         ListOrdered,
         Heading2
 } from 'lucide-react'
import StarterKit from '@tiptap/starter-kit'
import { Toggle } from '@/components/ui/toggle'
import Images from '@tiptap/extension-image'
import Heading from '@tiptap/extension-heading'
import CodeBlock from '@tiptap/extension-code-block'

export default function RichText({
    description,
    onChange,}:{
        description: string,
        onChange: (richText: string) => void
    }){
    const editor = useEditor({
        extensions: [
          StarterKit.configure(),
          Images,
          CodeBlock
        ],
        content: description,
        editorProps: {
            attributes:{
                class: "rounded-md border min-h-[200px] border-input bg-back"
            }
        },
        onUpdate({editor}){
            onChange(editor.getHTML())
        }
      })
    return(
        <div>
            <Toolbar editor={editor}/>
            <EditorContent editor={editor} />
        </div>
    )
}

type Props = {
    editor: Editor | null
}

export function Toolbar({editor}: Props){
    if(!editor){
        return null
    }
    return(
        <div>
            <Toggle
                size='sm'
                pressed={editor.isActive("heading")}
                onPressedChange={() => editor.chain().focus().toggleHeading({level: 2}).run()}
            >
                <Heading2 className='h-4 w-4'/>
            </Toggle>
            <Toggle
                size='sm'
                pressed={editor.isActive("bold")}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold className='h-4 w-4'/>
            </Toggle>
            <Toggle
                size='sm'
                pressed={editor.isActive("italic")}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic className='h-4 w-4'/>
            </Toggle>
            <Toggle
                size='sm'
                pressed={editor.isActive("strikethrough")}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            >
                <Strikethrough className='h-4 w-4'/>
            </Toggle>
            <Toggle
                size='sm'
                pressed={editor.isActive("code")}
                onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
            >
                <Code className='h-4 w-4'/>
            </Toggle>
            <Toggle
                size='sm'
                pressed={editor.isActive("list")}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            >
                <List className='h-4 w-4'/>
            </Toggle>
            <Toggle
                size='sm'
                pressed={editor.isActive("listOrdered")}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <ListOrdered className='h-4 w-4'/>
            </Toggle>
        </div>
    )
}