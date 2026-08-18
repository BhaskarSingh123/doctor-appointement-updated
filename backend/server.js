import express from "express"
import cors from 'cors'
import 'dotenv/config'
import http from "http"
import { Server } from "socket.io"
import { initSocket } from "./socket.js"

import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"

import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import aiRouter from "./routes/aiRoute.js"
import notificationRouter from "./routes/notificationRoute.js"

import ragRouter from "./routes/ragRoute.js"

// app config
const app = express()
const server = http.createServer(app)
const allowedOrigins = [
  "https://doctor-appointement-updated.vercel.app",
  "https://doctor-appointement-updated-t9yb.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174"
]
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
})

initSocket(io)

const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id)

  socket.on("join-room", (roomId) => {

      socket.join(roomId)

      console.log(`Socket joined room: ${roomId}`)

   })

  socket.on("disconnect", () => {
    console.log("User Disconnected")
  })

})
// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/ai", aiRouter)
app.use("/api/rag", ragRouter)
app.use("/api/notification", notificationRouter)
app.get("/", (req, res) => {
  res.send("API Working")
})

server.listen(port,"0.0.0.0", () =>
  console.log(`Server started on PORT:${port}`)
)