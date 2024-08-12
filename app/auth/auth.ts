import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { validateUser } from "@/actions/actions";
import { PrismaClient } from "@/prisma/generated/client";

const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);
const prismadb = new PrismaClient

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1 hour")
      .sign(key);
  }
  
  export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  }

  export async function signUp(formData: FormData){
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const username = formData.get("username") as string
    const newUser = await prismadb.user.create({
      data:{
        email,
        password,
        username
      }
    })
  }

export async function login(formData: FormData){
    //verify credentials and get user
    const user = {email: formData.get('email'), password: formData.get('password')};
    try {
      if(await validateUser(user)){
        //create the session
        const expires = new Date(Date.now() + 3600 * 1000)
        const session = await encrypt({user, expires})
  
        //save the session in a cookie
        cookies().set('session', session, {expires, httpOnly: true});
      }
      
    } catch (error: any) {
      console.log(error)
    }
    redirect("/")
}

export async function logout(){
    //destroy the session
    cookies().set('session', '', {expires: new Date(0)})
    redirect("/signin")
}

export async function getSession(){
    const session = cookies().get('session')?.value;
    if(!session) return null;
    return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;
  
    // Refresh the session so it doesn't expire
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 3600 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
      name: "session",
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expires,
    });
    return res;
  }