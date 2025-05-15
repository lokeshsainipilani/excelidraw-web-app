"use client"

import { useEffect, useState } from "react"
import { WS_URL } from "@/app/config";
import Canvas from "./Canvas";

const RoomCanvas = ({roomId}:{roomId:string}) =>{
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(()=>{
        const token = localStorage.getItem("token")

        if(!token){
            setLoading(false);
            return;
        }
        const ws = new WebSocket(`${WS_URL}?token=${token}`);

        ws.onopen = ()=>{
            setSocket(ws);
            setLoading(false)
            const data = JSON.stringify({
                type:"join_room",
                roomId,
            })
            console.log(data);
            ws.send(data);

        }
    }, [roomId]);

    if(!socket){
        return <div>connecting to the server...</div>
    }
    
    return <div className="w-full">
        <Canvas roomId={roomId} socket={socket} />
    </div>
}
export default RoomCanvas;