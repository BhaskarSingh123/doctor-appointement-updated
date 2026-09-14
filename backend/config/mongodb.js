import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected', () => console.log("Database Connected"))
    mongoose.connection.on('error', (err) => console.error("Database Connection Error:", err.message))
    mongoose.connection.on('disconnected', () => console.log("Database Disconnected — will attempt reconnect"))

    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`, {
            serverSelectionTimeoutMS: 30000,  // Wait up to 30s for server selection
            socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
            maxPoolSize: 10,
            retryWrites: true,
            retryReads: true,
        })
    } catch (error) {
        console.error("Initial MongoDB connection failed:", error.message)
        console.log("Retrying connection in 5 seconds...")
        setTimeout(() => connectDB(), 5000)
    }

}

export default connectDB;

// Do not use '@' symbol in your databse user's password else it will show an error.