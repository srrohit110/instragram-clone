import {Conversation} from '../models/conversation.modal.js';
import { Message } from '../models/message.modal.js';
export const sendMessage =async (req, res) => {
    try{
        const senderId = req.id;
        const receiverId = req.params.id;
        const {message} = req.body;
        let conversation = await Conversation.findOne({participants:{$all:[senderId,receiverId]}});
        if(!conversation){
            conversation = await Conversation.create({participants:[senderId,receiverId]});
            }
         const newMessage = await Message.createMessage({senderId,receiverId,message});
         if(newMessage) conversation,message.push(newMessage._id);
         await Promise.all([conversation.save(),newMessage.save()])
         res.status(201).json({message:"message sent successfully",newMessage});
    }catch(error){
        console.error(error);
    }
}

export const getMessage = async (req, res) => {
    try{
        const senderId = req.id;
        const receiverId = req.params.id;
        const conversation = await Conversation.find({participants:{$all:[senderId,receiverId]}});
        if(!conversation){
           return  res.status(200).json({message:"conversation not found"});
        }
         return res.status(200).json({success:true,message:conversation?.message});
    }catch(error){
        console.error(error);
    }
}