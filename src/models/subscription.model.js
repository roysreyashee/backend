import mongoose, { mongo, Schema }  from "mongoose";
import { User } from "./users.model";

const subscriptionSchema = new mongoose.Schema({

    subscriber: {
        type: Schema.Types.ObjectId, // One who is subscribing 
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // One to whom user is subscribing
        ref: "User"
    }

}, {timestamps: true})

export const Subscription = mongoose.model("subscriptions", subscriptionSchema)