// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
import dotenv from "dotenv";
dotenv.config({
    path: "./env"
});
import express from "express";
const app = express();


import connectDB from "./db/index.js";
connectDB()
.then(
    () => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on PORT ${process.env.PORT || 8000}`);

        })
    }
)
.catch((error) => {
    console.log(`Error while connecting to the database: ${error}`);
})
;
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