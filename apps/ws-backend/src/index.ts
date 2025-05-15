import {WebSocket, WebSocketServer } from "ws";
import jwt, {JwtPayload} from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import {PrismaClient} from "@prisma/client"
import { createClient } from "redis";

const prisma = new PrismaClient();


const wss = new WebSocketServer({port:8080});
const publisher = createClient();

export const TOPIC = "chat_messages";

(async () => {
  await publisher.connect();
  console.log("Redis connected successfully");
})();

interface User{
    ws: WebSocket,
    rooms: string[],
    userId: string
}
const users:User[] = []

// function checkUser(token:string): string | null{
//     try{
//         const decoded = jwt.verify(token, JWT_SECRET);

//         if(typeof decoded == "string"){
//             return null
//         }
//         if(!decoded || !decoded.userId){
//             return null
//         }

//         return decoded.userId;
//     }catch(e){
//         return null
//     }
//     return null
// }

// wss.on('connection', function connection(ws, request){
//     const url = request.url;
//     if(!url){
//         return;
//     }

//     const queryParams = new URLSearchParams(url.split('?')[1]);
//     const token = queryParams.get('token') || "";
//     const userId = checkUser(token);

//     if(userId == null){
//         ws.close()
//         return null;
//     }

//     users.push({
//         userId,
//         rooms:[],
//         ws
//     })

//     ws.on('message', async function message(data){
//         let parsedData;
//         if(typeof data !== "string"){
//             parsedData = JSON.parse(data.toString());
//         }else{
//             parsedData = JSON.parse(data);
//         }

//         if(parsedData.type === "join_room"){
//             const user = users.find(x => x.ws =ws);
//             user?.rooms.push(parsedData.roomId);
//         }

//         if(parsedData.type === "leave_room"){
//             const user = users.find(x => x.ws = ws);
//             if(!user){
//                 return
//             }
//             user.rooms = user?.rooms.filter(x => x === parsedData.room);
//         }

//         console.log("message received")
//         console.log(parsedData)

//         if(parsedData.type === "chat"){
//             const roomId = parsedData.roomId;
//             const message = parsedData.message;

//             await prisma.chat.create({
//                 data:{
//                     roomId,
//                     message,
//                     userId
//                 }
//             });
//             users.forEach(user =>{
//                 if(user.rooms.includes(roomId)){
//                     user.ws.send(JSON.stringify({
//                         message:message,
//                         type:"chat",
//                         roomId
//                     }))
//                 }
//             })
//         }
//     })
// })


function checkUser(token: string): string | null {
  try {
    const decode = jwt.verify(token, JWT_SECRET);
    if (!decode || !(decode as JwtPayload).userId) {
      return null;
    }

    return (decode as JwtPayload).userId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

wss.on("connection", async (ws, request) => {
  const url = request.url;
  // console.log("wss url", url); // wss://localhost:8080/?token=123&name=abc...

  if (!url) {
    return;
  }

  const urlParams = new URLSearchParams(url.split("?")[1]); //token=123&name=abc...
  // console.log("urlParams", urlParams);
  const token = urlParams.get("token") || "";
  const userId = checkUser(token);

  if (!userId) {
    ws.close();
    return null;
  }

  const user: User = { userId, rooms: [], ws };
  users.push(user);

  ws.on("message", async (message) => {
    let parsedData;
    if (typeof message !== "string") {
      parsedData = JSON.parse(message.toString());
    } else {
      parsedData = JSON.parse(message);
    }

    if (parsedData.type === "join_room") {
      const roomId = (parsedData.roomId);
      const user = users.find((user) => user.ws === ws);
      if (user) {
        // console.log("User pushed connection extablished");

        user.rooms.push(roomId);
      }

      // console.log(users);

      const rooms = users.flatMap((user) => {
        return user.rooms;
      });

      // console.log(rooms);
      //TODO: add room in DB , else chat room id not found -> error-> foreignKeyViolates

      // if(rooms.length >= 1){
      //   await prisma.rooms.create({
      //     data: {

      //     }
      //   })
      // }
    }

    if (parsedData.type === "leave_room") {
      const roomId = (parsedData.roomId);
      const user = users.find((user) => user.ws === ws);
      if (user) {
        user.rooms = user.rooms.filter((r) => r !== roomId);
      }
      //TODO: if rooms has no user delete room from DB
      // console.log(users);
    }

    if (parsedData.type === "chat") {
      const roomId = (parsedData.roomId);
      const message = parsedData.message;

      // console.log({ roomId, message });

      const user = users.filter((user) => user.userId === userId)[0];
      // console.log(user);

      // if (!user || user.rooms.indexOf(roomId) === -1) {
      //   ws.send("You are not allowed to send message to this room");
      //   ws.close();
      //   return null;
      // }

      // await prisma.chat.create({ //TODO: use redis Queues
      //   data: {
      //     roomId,
      //     message,
      //     userId,
      //   },
      // });

      await publisher.xAdd(TOPIC, "*", {
        roomId: String(roomId),
        message,
        userId,
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              roomId,
              message,
            })
          );
        }
      });

      // console.log(users);
    }

    if (parsedData.type === "move_shape") {
      const roomId = (parsedData.roomId);
      const { shape, shapeIndex } = parsedData;
      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "move_shape",
              roomId,
              shape,
              shapeIndex,
            })
          );
        }
      });
    }

    if (parsedData.type === "delete_shape") {
      const { deleteIndex, roomId } = parsedData;

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "delete_shape",
              deleteIndex,
              roomId,
            })
          );
        }
      });
    }

    if (parsedData.type === "delete_shape_by_id") {
      const { shapeId, roomId } = parsedData;

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "delete_shape_by_id",
              shapeId,
              roomId,
            })
          );
        }
      });
    }
  });

  ws.on("close", () => {
    const index = users.indexOf(user);
    if (index !== -1) {
      users.slice(index, 1);
    }
  });
});