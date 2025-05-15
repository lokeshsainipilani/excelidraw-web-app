"use client"

import { BACKEND_URL } from "@/app/config"
import { CreateRoomSchema } from "@repo/common/types"
import axios, { AxiosError } from "axios"
import { redirect, useRouter } from "next/navigation"
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"
import { Footer } from "./Footer"
import { Navbar } from "./Navbar"
import { FaPlay } from "react-icons/fa";

interface Room{
    id:number
    slug: string
    createdAt: Date
    adminId: string
}

export default function DashboardPage(){
    const [token, setToken] = useState<string>("");
    const router = useRouter()
    const joinRoomRef = useRef<string>("");
    const createRoomRef = useRef<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [error, setError] = useState<string>("");

    useEffect(()=>{
        const token = localStorage.getItem("token");
        console.log(token);

        if(!token){
            redirect("/")
        }

        async function getRoom(){
            try{
                
                const response = await axios.get(`${BACKEND_URL}/user/rooms`,{
                    headers:{
                        Authorization:token
                    }
                })
                console.log(response.data)
                setRooms(response.data);
                setLoading(false);

            }catch(e){
                console.log(e)
            }
        }
        setToken(token);
        getRoom()
    },[]);

    async function createRoom(e:FormEvent) {
        e.preventDefault();

        const parsedBody = CreateRoomSchema.safeParse({
            name:createRoomRef.current
        });

        if(!parsedBody.success){
            setError(parsedBody.error.errors[0].message);
            return;
        }
       setLoading(true);

        try{
            await axios.post(`${BACKEND_URL}/create`,{
                name:parsedBody.data.name,
            },
            {
                headers:{
                    Authorization:token
                }
            }
        )
        router.push(`/canvas/${createRoomRef.current}`)
        }catch(e){
            if (e instanceof AxiosError) {
                setError(e.response?.data.error);
              } else {
                setError("Something went wrong.");
              }
        
              setLoading(false);
              setTimeout(() => setError(""), 3000);
        }
    }

    return (
        <div>
          {loading && (
            <div className="z-30 fixed w-screen h-screen bg-black/50 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
    
          <Navbar />
          <div className="max-w-7xl w-full mx-auto my-5 px-2">
            {/* Join room */}
            <p className="text-md md:text-xl font-semibold mb-3">Join Room</p>
            <form className="w-full flex justify-center items-center mb-5 h-7 md:h-10">
              <input
                type="text"
                className="rounded-l-md px-4 py-1 md:py-2 flex-1 border text-sm h-full"
                placeholder="Room name"
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  (joinRoomRef.current = e.target.value)
                }
              />
              <button
                onClick={() => {
                 setLoading(true);
                  router.push(`/canvas/${joinRoomRef.current}`);
                }}
               disabled={loading}
                className="bg-gray-900 text-white px-4 py-1 md:py-2 rounded-r-md w-[30%] md:w-[10%] disabled:bg-primary/40 transition-all text-sm text-center h-full flex justify-center items-center"
              >
                Join
              </button>
            </form>
    
            <p className="text-md md:text-xl font-semibold mb-3">
              Your Rooms ({rooms.length})
            </p>
            <div className="rounded-md">
              <ul className="flex flex-col w-full justify-start items-center border rounded-md overflow-y-auto h-[calc(100vh-15rem)] relative divide-y">
                <li className="sticky top-0 left-0 flex w-full text-md font-medium divide-x bg-gray-100">
                  <div className="w-[15%] p-1 md:px-4 md:py-2 text-center">Id</div>
                  <div className="w-[40%] p-1 md:px-4 md:py-2 text-center">
                    Name
                  </div>
                  <div className="w-[30%] p-1 md:px-4 md:py-2 text-center">
                    Created At
                  </div>
                  <div className="w-[15%] p-1 md:px-4 md:py-2 text-center">
                    Join
                  </div>
                </li>
                {/* Rooms */}
                {rooms.map((room) => (
                  <li key={room.id} className="flex w-full divide-x">
                    <div className="w-[15%] p-1 md:px-4 md:py-2 text-center text-sm truncate">
                      {room.id}
                    </div>
                    <div className="w-[40%] p-1 md:px-4 md:py-2 text-center text-sm truncate">
                      {room.slug}
                    </div>
                    <div className="w-[30%] p-1 md:px-4 md:py-2 text-center text-sm truncate">
                      {new Date(room.createdAt).toLocaleString()}
                    </div>
                    <button
                      onClick={() => {
                       setLoading(true);
                        redirect(`/canvas/${room.slug}`);
                      }}
                      className="w-[15%] p-1 md:px-4  md:py-2 text-center flex justify-center items-center hover:text-primary text-black/50 transition-all"
                    >
                      <FaPlay size={14} />
                    </button>
                  </li>
                ))}
    
                <li className="flex-1 flex justify-center items-center text-gray-300">
                  {rooms.length === 0 && <div>No rooms!</div>}
                </li>
    
                {/* Create room */}
                <form className="sticky bg-white left-0 bottom-0 w-full flex justify-center border-none items-start h-7 md:h-10">
                  <input
                    type="text"
                    className="rounded-l-md px-4 py-1 md:py-2 flex-1 border text-sm h-full"
                    placeholder="Room name"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      (createRoomRef.current = e.target.value)
                    }
                  />
                  <button
                    onClick={createRoom}
                    disabled={loading}
                    className="bg-gray-900 text-white px-4 py-1 md:py-2 rounded-r-md w-[30%] md:w-[10%] disabled:bg-primary/40 transition-all text-sm text-center h-full flex justify-center items-center"
                  >
                    Create
                  </button>
                </form>
              </ul>
              {error && <span className="text-red-500">{error}</span>}
            </div>
          </div>
          <Footer />
        </div>
      );
}