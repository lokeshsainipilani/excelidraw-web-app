import express, { Request, Response } from "express";
import cors from "cors"
import jwt from "jsonwebtoken"
import {PrismaClient} from "@repo/db/client"
import {CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types"
import {JWT_SECRET} from "@repo/backend-common/config"
import { middleware } from "./middleware";

const app = express();

const prisma = new PrismaClient()
app.use(express.json());
app.use(cors())

app.post("/signup", async(req:Request, res:Response)=>{
    console.log(req.body)
    const parsedData = SigninSchema.safeParse(req.body);
    console.log(parsedData.success)
    if(!parsedData.success){
         res.json({
            message:"incorrect inputs"
        });
        return;
    }
    try{
        const user = await prisma.user.create({
            data:{
                email:parsedData.data.username,
                password:parsedData.data.password,
                
            }
        })

        const token = jwt.sign({userId:user.id}, JWT_SECRET)
        res.json(
          {  token}
        )
    }catch(e){
        res.status(411).json({
            message:"user already exists with the username"
        })
    }
})

app.post("/login", async(req:Request, res:Response)=>{
    const parsedData = SigninSchema.safeParse(req.body);

    if(!parsedData.success){
        res.status(411).json({
            message:'incorrect inputs'
        });
        return;
    }
    try{
        const user = await prisma.user.findFirst({
            where:{
                email:parsedData.data.username,
                password: parsedData.data.password
            }
        })
        if(!user){
             res.status(403).json({
                message:"not authorized "
            });
            return;
        }
        const token = jwt.sign({userId:user.id}, JWT_SECRET );

        res.json({token})
    }catch(e){
        res.status(411).json({
            message:"user doesn't exist"
        })
    }
})

app.get("/user/rooms", middleware, async (req, res)=>{
    const userId  = req.userId;
    console.log(userId)

    try{
        const room = await prisma.room.findMany({
            where:{
                adminId:userId
            }
        })
        console.log(room)
        res.json(room)
    }catch(e){
        res.status(500).json({message:"something went wrong"});
        return;
    }
})

app.post("/room", middleware, async(req:Request, res:Response)=>{

    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
         res.json({
            message: "incorrect inputs"
        });
        return;
    }
    const userId = req.userId

    try{
        const room = await prisma.room.create({
            //@ts-ignore
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

        res.json({
            roomId:room.id
        })
    }
    catch(e){
        res.status(411).json({
            message:"room already exists with this name"
        })
    }
})

app.post("/create",middleware, async (req, res)=>{
    const parsedBody = CreateRoomSchema.safeParse(req.body);
    if(!parsedBody.success){
        res.status(400).json({message:"invalid data"})
        return;
    }
    const adminId = req.userId

    try{
        const room = await prisma.room.create({
            data:{
                adminId,
                slug:parsedBody.data.name,
                
            }
        })
        res.json({roomId:room.id})
    }catch(e){
        res.status(400).json({ error: "Room already exists." });
    }
})

app.get("/chats/:roomId", async(req:Request, res:Response)=>{

    try{

        const roomId = (req.params.roomId);

        const messages = await prisma.chat.findMany({
            where:{
                roomId:roomId
            },
            orderBy:{
                id:"desc"
            },
            take:1000
        });
        res.json({
            messages
        })
    }catch(e){
        res.json({
            messages:[]
        })
    }
})

app.get("/room/:slug", async(req:Request, res:Response)=>{
    const slug = req.params.slug;
    const room = await prisma.room.findFirst({
        where:{
            slug
        },

    });
    res.json({
        room
    })
})

app.listen(3002)
