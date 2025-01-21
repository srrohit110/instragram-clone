import { User } from '../models/user.modal.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getDataUri from '../utils/datauri.js';

export const register = async (req, req) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json({
                message: 'Please fill in all fields',
                success: false,
            });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: 'try different email',
                success: false,
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email,
            password: hashedPassword,

        })
        return res.status(201).json({
            message: 'account created',
            success: true,
        });
    } catch (error) {
        console.log(error);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: 'Please fill in all fields',
                success: false,
            });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: 'Incorrect email or password',
                success: false,
            });

        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: 'Incorrect email or password',
                success: false,
            });
        }
        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY,
            {
                expiresIn: '1h',
            }
        );
        user ={
            _id:user._id,
            username:user.username,
            email:user.email,
            profilePicture:user.profilePicture,
            bio:user.bio,
            followers:user.followers,
            following:user.following,
            posts:user.posts

        }
        return res.cookies('token',token,{httpOnly:true,sameSite:'strict',maxiAge:1*24*60*60*1000}).json({
            message: `Welcome Back ${user.username}`,
            success: true,
            user
        })
       
    } catch (error) {
        console.log(error);
    }

}

export const logout = async (_, res) => {
    try{
        return res.cookies("token","",{maxAge:0}).json({
            message: "Logged out successfully",
            success: true
        });
    }catch(error){
 console.log(error);
 
    }
}

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.Id;
        const user = await User.findById(userId);
        return res.status(200).json({
            user,
            success: true
        })
    }catch(error){
        console.log(error);
    }
}

export const editProfile = async (req, res) => {
try{
    const userId = req.Id;
    const { bio, gender} = req.body;
    const profilePicture = req.file;
    let cloudResponse;
    if(profilePicture){
       const fileUri = getDataUri(profilePicture);
      cloudResponse= await cloudinary.uploader.upload(fileUri);

    }
    const user =  await User.findById(userId);
    if(!user){
        return res.status(404).json({
            message: "User not found",
            success: false
            });
    }
   if(bio) user.bio = bio;
   if(gender) user.gender = gender;
   if(profilePicture ) user.profilePicture = cloudResponse.secure_url;

await user.save();
return res.status(200).json({
    message: "Profile updated successfully",
    success: true,
    user
    });

}catch(error){
    console.log(error);
}
}