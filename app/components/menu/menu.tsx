import Image from "next/image";
import Link from "next/link";

export default function MenuItem({icon, text}:{icon: any, text: string}) {
    const Icon = icon
  return (
    <div className="display: flex flex-row text-center justify-items-center p-6 hover:cursor-pointer hover:text-green-400 border-t border-green-400">
        <Icon />
        <p>{text}</p>
    </div>
  )
}
