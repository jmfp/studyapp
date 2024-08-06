import Link from 'next/link';
import Image from 'next/image'
import { GiHearts } from 'react-icons/gi';
import { post } from '@/app/lib/interface';
import { getUserObject } from '@/actions/actions';

export default async function Post({post}:{post: post}) {
    const user = await getUserObject(post.friendId)
    console.log(user)
  return (
    <div className="display: flex flex-col m-auto w-full h-60 border border-green-500 rounded-lg gap-4">
      <div className="display: flex">
        <div className='display: flex flex-col items-center'>
            <Link href={`user/${post.friendId}`}>
              <Image 
                src={post.pic}
                alt="User pic"
                width={200}
                height={200}
                className="m-auto mt-3 ml-3 border border-green-400 rounded-full h-[100px] w-[100px] object-cover"
              />
            </Link>
            <div className='text-green-500 m-auto'>
                {user?.username}
            </div>
        </div>
        <p>{post.content}</p>
        {post.pictures === '' ? <span/> : 
              <Image src={`/${decodeURIComponent(post.pictures)}`}
                alt='picture'
                width={200}
                height={200}
              />
            }
      </div>
      <div className="display: flex items-center text-center justify-between border-t border-green-400">
        <div className="display: flex text-center items-center gap-2 m-auto">
          <GiHearts className="text-green-400"/>
          <p>{post.likes.length}</p>
        </div>
      </div>
    </div>
  )
}
