import mongoose from "mongoose";
import {DB_NAME} from "./constants.js";

const connectDB = async() => {
    try{

        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    }catch(err){
        console.log("Error while connecting to the database", err);
        process.exit(1);
    }
}
