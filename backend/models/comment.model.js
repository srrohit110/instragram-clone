import mongoose from "mongoose";
const CommentSchema = new mongoose.Schema({
text:{type:String ,required:true},
author:{type:mongoose.Schema.Types.ObjectId,ref:'user',reuired:true},
post:{type:mongoose.Schema.Types.ObjectId,ref:'post',required:true},
});
export default  CommentSchema = mongoose.model('comment', CommentSchema);