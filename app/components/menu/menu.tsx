import Image from "next/image";
import Link from "next/link";

export default function MenuItem({icon, text}:{icon: any, text: string}) {
    const Icon = icon
  return (
    <div className="display: flex flex-row text-center gap-4 items-center p-6 hover:cursor-pointer hover:text-primary">
        <Icon />
        <p className="max-sm:hidden">{text}</p>
    </div>
  )
}


