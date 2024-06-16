const Post = require("../models/post.model");

// const asyncHandler = require("express-async-handler");

// exports.post_list = asyncHandler(async (req, res, next) => {
//   const firstPosts = await Post.find().sort({ timeStamp: 1 }).limit(5).exec();

//   res.status(200).json({ posts: firstPosts });
// });

exports.post_index = async (req, res) => {
  const firstFivePosts = await Post.find()
    .sort({ timeStamp: 1 })
    .limit(5)
    .exec();

  return res.status(200).json({ posts: firstFivePosts });
};

exports.post_create = async (req, res) => {
  console.log(req.user);
  if (!req.user) return res.status(400).json({ message: "Login or singup!" });

  if (!req.body.title || !req.body.text)
    return res.status(400).json({ message: "Enter title and text" });

  const newPost = new Post({
    title: req.body.title,
    text: req.body.text,
    author: req.user._id,
    hidden: req.body.hidden,
  });

  await newPost.save();

  return res.status(200).json({ post: newPost, message: "Post was created" });
};
