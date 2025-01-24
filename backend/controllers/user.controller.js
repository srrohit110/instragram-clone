import { User } from '../models/user.modal.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getDataUri from '../utils/datauri.js';
import cloudinary from '../utils/cloudinary.js';

export const register = async (req, res) => {
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
       const populatedPost =await Promise.all(
        user.posts.map(async (postId) => {
            const post =await Post.findById(postId);
            if(post.author.equals(user._id)){
                return post;
            }
            return null;
        })
       )
    

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts:populatedPost

        }
        const token =await jwt.sign({ userId: user._id }, process.env.SECRET_KEY,
            {
                expiresIn: '1d',
            }
        );
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxiAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome Back ${user.username}`,
            success: true,
            user
        })

    } catch (error) {
        console.log(error);
    }

}

export const logout = async (_, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully",
            success: true
        });
    } catch (error) {
        console.log(error);

    }
}

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).select('-password');
       
        
        return res.status(200).json({
            user,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;
        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);

        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();
        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
}

export const getSuggestedUser = async (req, res) => {
    try {
        const suggestedUser = await User.find({ _id: { $ne: req.id } }).select("password");
        if (!suggestedUser) {
            return res.status(404).json({
                message: "No suggested user found",
                success: false
            });
        }
        return res.status(200).json({
            success: true,
            users: suggestedUser,
        });
    } catch (error) {
        console.log(error);
    }
}
export const followOrUnfollow = async (req, res) => {
    try {
       const followKarneWala = req.id;
       const jiskoFollowKrunga = req.params.id;
       if(followKarneWala === jiskoFollowKrunga){
        return res.status(400).json({
            message: "You can't follow yourself",
            success: false
            });

       }
       const user = await User.findById(followKarneWala);
       const targetUser = await User.findById(jiskoFollowKrunga);
       if(!user || !targetUser){
        return res.status(400).json({
            message: "User not found",
            success: false
            });
            }

            const isFollowing = user.following.includes(jiskoFollowKrunga);
            if(isFollowing){
                await Promise.all([
                    User.updateOne({_id:followKarneWala},{$pull:{following:jiskoFollowKrunga}}),
                    User.updateOne({_id:jiskoFollowKrunga},{$pull:{followers:followKarneWala}}),
                ])
                return res.status(200).json({
                    message: "Unfollowed successfully",
                    success: true
                    });
            }else{
                await Promise.all([
                    User.updateOne({_id:followKarneWala},{$push:{following:jiskoFollowKrunga}}),
                    User.updateOne({_id:jiskoFollowKrunga},{$push:{followers:followKarneWala}}),
                ])
                return res.status(200).json({
                    message: "followed successfully",
                    success: true
                    });
            }
    } catch (error) {
        console.log(error);
    }
}