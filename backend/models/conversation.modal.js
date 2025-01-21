import mongoose from "mongoose";

const conversationSchemma = new mongoose.Schema({
    participants:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    messages:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Message"
        }],
})
export const Conversation = mongoose.model("Conversation", conversationSchemma);