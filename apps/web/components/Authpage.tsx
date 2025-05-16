"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useRef, useState } from "react";
import {SigninSchema} from "@repo/common/types"
import axios, { AxiosError } from "axios";
import { BACKEND_URL } from "@/app/config";
import { Navbar } from "./Navbar";
import Icon from "@/public/icon";
import Link from "next/link";
import { Footer } from "./Footer";



export function AuthPage({page}:{page: "signup" | "login"}){

    const router = useRouter();
    const usernameRef = useRef<string>("");
    const passwordRef = useRef<string>("");
    const [error, setError] = useState<string>("");

    async function handleSubmit(e:FormEvent) {
        e.preventDefault();

        const parsedBody = SigninSchema.safeParse({
            username:usernameRef.current,
            password: passwordRef.current
        });

        if(!parsedBody.success){
            setError(parsedBody.error.errors[0].message);
            return
        }
        try{

            const response = await axios.post(`${BACKEND_URL}/${page}`,{
                username:parsedBody.data.username,
                password: parsedBody.data.password
            });

            localStorage.setItem("token", response.data.token);
            console.log("token stored", localStorage.getItem("token"))
            router.push("/dashboard");

        }catch(e){
            if(e instanceof AxiosError){
                setError(e.response?.data.error);
            }else{
                setError("something went wrong")
            }
        }
    }

    return (
        <section>
        <Navbar />
        <form
          className="h-screen flex flex-col justify-center items-start p-2 md:w-1/4 gap-3 mx-auto"
          onSubmit={handleSubmit}
        >
          <p className="md:text-xl font-semibold flex justify-center items-center gap-3">
            <Icon size="md" />
            {page === "signup" ? "Sign Up" : "Log In"}
          </p>
          <div className="flex flex-col justify-center items-start w-full">
            <label htmlFor="username" className="text-sm">
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Username"
              className="px-4 py-2 border bg-gray-100 rounded-md w-full"
              onChange={(e) => (usernameRef.current = e.target.value)}
            />
          </div>
          <div className="flex flex-col justify-center items-start w-full">
            <label htmlFor="password" className="text-sm">
              Password
            </label>
            <input
              type="text"
              id="password"
              placeholder="Password"
              className="px-4 py-2 border bg-gray-100 rounded-md w-full"
              onChange={(e) => (passwordRef.current = e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
  
          {page === "login" ? (
            <p className="text-sm">
              {"Don't have an account? "}
              <Link href={"/signup"} className="underline">
                Create Account
              </Link>
            </p>
          ) : (
            <p className="text-sm">
              Already have an account?{" "}
              <Link href={"/login"} className="underline">
                Log In
              </Link>
            </p>
          )}
          <button
            className="hover:bg-gray-900 border border-primary hover:text-white px-4 py-1 md:py-2 rounded-full w-full"
            type="submit"
          >
            {page === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        <Footer />
      </section>
    )
    
}