import Link from 'next/link';
import Image from 'next/image'
import { GiHearts } from 'react-icons/gi';
import { post } from '@/app/lib/interface';
import { getUserObject } from '@/actions/actions';

export default async function Post({post}:{post: post}) {
    const user = await getUserObject(post.friendId)
    console.log(post)
  return (
    <div className="display: flex flex-col m-auto w-[90%] h-30 border border-green-500 rounded-lg gap-4">
      <div className="display: flex flex-col h-full m-3">
        <div className='display: flex flex-row m-3'>
            <Link href={`user/${post.friendId}`}>
              <Image 
                src={post.pic}
                alt="User pic"
                width={200}
                height={200}
                className="m-auto mt-3 ml-3 border border-green-400 rounded-full h-[50px] w-[50px] object-cover"
              />
            </Link>
            <div className='text-green-500 lg:mt-6 lg:ml-3'>
                {user?.username}
            </div>
        </div>
        <div className="display: flex flex-col m-auto overflow-y-hidden">
            <p>{post.content}</p>
            {post.pictures === undefined ? <span/> : 
              <Image src={decodeURIComponent(post.pictures)}
                alt='picture'
                width={200}
                height={200}
                className='rounded-lg h-[300px] w-[300px] object-cover'
              />
            }
        </div>
      </div>
      <div className="display: flex items-center text-center justify-between border-t border-primary">
        <div className="display: flex lg:h-10 text-center items-center m-auto">
          <GiHearts className={``}/>
          <p>{post.likes.length}</p>
        </div>
      </div>
    </div>
  )
}
