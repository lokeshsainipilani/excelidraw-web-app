import { BACKEND_URL } from "@/app/config";
import axios from "axios";


export async function getCanvasShapes(roomId: string){
    const res = await axios.get(`${BACKEND_URL}/chats/${roomId}`)
    const messages = await res.data?.message || [];

    const shapes = messages.map(({message}:{message:string})=>{
        const messageData = JSON.parse(message)
        return messageData.shape
    })

    return shapes.filter((shape:any) => shape !== null);
}