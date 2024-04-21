import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Image
        src='https://images.unsplash.com/photo-1547916721-7469af15e2a3?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        width={1920}
        height={500}
        alt='cleveland web design'
      />
      <h1>Hello, Next.js!</h1>
    </div>
  );
}
