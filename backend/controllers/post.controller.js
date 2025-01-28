import sharp from 'sharp';
import { Post } from '../models/post.modal.js';
import { User } from '../models/user.modal.js';
import { Comment } from '../models/comment.model.js';
import cloudinary from '../utils/cloudinary.js';

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorID = req.id;

        if (!image) return res.status(400).json({ message: "Please add an image" });
        //image upload
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize(800, 600, { fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();

        //save image to database
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        //save post to database
        const post = await Post.create({
            caption: caption,
            image: cloudResponse.secure_url,
            author: authorID
        });
        const user = await User.findById(authorID);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }
        await post.populate({ path: 'author', select: '-password' });
        return res.status(201).json({
            post: post,
            message: "New post added",
            success: true,
        });

    } catch (error) {
        console.log(error);
        return res.status(404).json({
            error: error,
            erroMmessage: error.message,
            message: "New post not added",
            success: false,
        });
    }
}
export const getAllPosts = async (req, res) => {
    try {

        const posts = await Post.find().populate({ path: 'author', select: 'username profilePicture' }).sort({ createdAt: -1 });

        return res.status(200).json({ posts: posts, success: true });
    } catch (error) {
        console.log(error);
        return res.status(404).json({
            error: error,
            erroMmessage: error.message,
            message: "New post not added",
            success: false,
        });
    }
};

export const getUserPost = async (req, res) => {
    try {
        const authorID = req.id;
        const posts = await Post.find({ author: authorID })
            .populate({
                path: 'author', select: 'username profilePicture'
            })
            .populate({
                path: 'Comments',
                select: '-password',
                sort: ({ createdAt: -1 }),
                populate: {
                    path: 'author',
                    select: 'username profilePicture',
                }
            });
        return res.status(200).json({ posts: posts, success: true });
    } catch (error) {
        console.log(error);
    }
}

export const likePost = async (req, res) => {
    try {
        const likeKarneWalaUserKiId = req.id;
        const postID = req.params.id;
        const post = await Post.findById(postID);
        if (!post)
            return res.status(404).json({ message: "Post not found", success: false });
        // like logic
        await post.updateOne({ $addToSet: { likes: likeKarneWalaUserKiId } });
        await post.save();

        // implement socket io here
        return res.status(200).json({ message: "Post liked successfully", success: true });
    } catch (error) {
        console.log(error);
    }
}


export const dislikePost = async (req, res) => {
    try {
        const likeKarneWalaUserKiId = req.id;
        const postID = req.params.id;
        const post = await Post.findById(postID);
        if (!post)
            return res.status(404).json({ message: "Post not found", success: false });
        // like logic
        await post.updateOne({ $pull: { likes: likeKarneWalaUserKiId } });
        await post.save();

        // implement socket io here

        return res.status(200).json({ message: "Post disliked successfully", success: true });
    } catch (error) {
        console.log(error);
    }
}

export const addcomment = async (req, res) => {
    try {

        const postID = req.params.id;
        const commentKarneWalaKiId = req.id;
        const { text } = req.body;
        const post = await Post.findById(postID);
        if (!text) return res.status(404).json({ message: "text not found", success: false });
        const comment = await Comment.create({ text, author: commentKarneWalaKiId, post: postID })
        // .populate({
        //     path: 'author',
        //     select: 'username profilePicture',
        // });

        post.Comments.push(comment._id);
        await post.save();
        return res.status(200).json({ message: "Comment added successfully", success: true });
    } catch (error) {
        console.log(error);
        return res.status(404).json({ message: "Comment not added successfully", success: false, error: error, errorMessage: error.message });

    }
}

export const getCommentsOfPost = async (req, res) => {
    try {
        const postID = req.params.id;
        const comments = await Comment.find({ post: postID }).populate({
            path: 'author',
            select: 'username profilePicture',
        });
        return res.status(200).json({ comments, success: true });

    } catch (error) {
        console.log(error);
    }
}

export const deletePost = async (req, res) => {
    try {
        const authorID = req.id;
        const posts = await Post.find({ author: authorID });
        if (!posts) return res.status(403).json({ message: "Post not found!", success: true });
        // delete post
        const postID = req.params.id;
        await Post.findByIdAndDelete(postID);

        //remove the post id from the user
        let user = await User.findById(authorID);
        user.posts = user.posts.filter(id => id.toString() === postID);
        await user.save();
        // delete the comments of the post
        await Comment.deleteMany({ post: postID });

        return res.status(200).json({ message: "Post deleted successfully", success: true });

    } catch (error) {
        console.log(error);
    }
}

export const bookmarkPost = async (req, res) => {
    try {
        const postID = req.params.id;
        const authorID = req.id;
        const post = await Post.findById(postID);
        if (!post) return res.status(404).json({ message: "Post not found", success: false });
        const user = await User.findById(authorID);
        if (user.bookmarks.includes(post._ID)) {
            await user.updateOne({ $pull: { bookmarks: post._id } });
            await user.save();
            return res.status(200).json({
                message: "Post unbookmarked", success: true
            });
        }
        await user.updateOne({ $addToSet: { bookmarks: post._id } });
        return res.status(200).json({
            message: "Post bookmarked successfully",
            success: true,
        });

    } catch (error) {
        console.log(error);
    }
}