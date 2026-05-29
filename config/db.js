import mongoose from "mongoose";
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Mongodb Connected");
  } catch (err) {
    console.error("Error connecting mongodb: ", err);
  }
};

export default connectDB;
