// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
import dotenv from "dotenv";
dotenv.config({
    path: "./env"
});
import express from "express";
const app = express();


import connectDB from "./db/index.js";
connectDB();
// (
//     async() => {
//         try{

//             await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//             app.on("error", (err) => {
//                 console.log("Error", err);
//                 throw err;
//             })

//             app.listen(process.env.PORT, () => {
//                 console.log(`Sever is running on PORT ${process.env.PORT}`);
//             })
//         }catch(error){
//             console.log("Error while connecting to the database", error);

//             throw error;
//         }
//     }
// )()