

let io

export const initSocket = (socketIO) => {
   io = socketIO
}

export const getIO = () => {
   if (!io) {
      throw new Error("Socket.io not initialized")
   }
   return io
}