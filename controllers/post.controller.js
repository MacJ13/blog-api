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

exports.post_detail = async (req, res) => {
  const post = await Post.findById(req.params.postId).exec();

  if (!post) return res.status(404).json({ message: "Post doesn't exist" });

  return res.status(200).json({ post });
};

exports.post_list = async (req, res) => {
  const posts = await Post.find().sort({ timeStamp: 1 }).exec();

  const limit = 15;

  const page = Number(req.query.page) || 1;

  const start = (page - 1) * limit;

  const end = page * limit;

  const slicePosts = posts.slice(start, end);

  // console.log(posts.length);

  // console.log(req.query);
  // console.log(slicePosts);
  // console.log({ start, end });

  return res.status(200).json({ posts: slicePosts, page, limit });
};
