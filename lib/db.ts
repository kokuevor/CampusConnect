import mongoose from "mongoose"

const dbConnect = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log("Already connected to db")
      return
    }
    mongoose.set("strictQuery", false)
    const conn = await mongoose.connect(process.env.DB_URI as string)
    console.log(`DB Connected - ${conn.connection.host}`)
  } catch (error) {
    console.log("DB connection failed", error)
    throw error
  }
}

export default dbConnect
