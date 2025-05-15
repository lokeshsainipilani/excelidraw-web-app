import { BACKEND_URL } from "@/app/config";
import RoomCanvas from "@/components/RoomCanvas";
import axios from "axios";
import Link from "next/link";
export default async function Page({params}:{params:Promise<{roomId:string}>}){

    const slug = (await params).roomId
    
    try{
         const response = await axios.get(`${BACKEND_URL}/room/${slug}`);
         const roomId = response.data.id;
         return <RoomCanvas roomId={roomId} />;
    }
    catch(e){
        console.log(e)
    
    return  (
      <div className="h-screen flex flex-col justify-center items-center gap-3">
        <p className="text-2xl">Invalid Room Name</p>
        <p className="text-md">
          Go to{" "}
          <Link href={"/dashboard"} className="underline text-blue-500">
            dashboard
          </Link>
        </p>
      </div>
    );
}
}