const Post = require("../models/post.model");
const Comment = require("../models/comment.model");

const { body, validationResult } = require("express-validator");

const {
  POST_TITLE_LENGTH,
  POST_BODY_LENGTH,
  POSTS_PER_PAGE,
} = require("../configs/main.config");

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

exports.post_create = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Post Title field must not be empty!")
    .isLength(POST_TITLE_LENGTH)
    .withMessage(`Post Title must contain ${POST_TITLE_LENGTH} letters!`),
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Post body must not be empty!")
    .isLength(POST_BODY_LENGTH)
    .withMessage(`Post body must contain ${POST_BODY_LENGTH} letters!`),
  async (req, res) => {
    // check authorized user exists
    if (!req.userAuth)
      // user is undefined - unauthorized
      return res.status(401).json({ err: "Unauthorized user" });

    const result = validationResult(req);

    // validation falied and send errors
    if (!result.isEmpty()) {
      const msgErrors = result.errors.map((err) => err.msg);
      // return res.status(400).json({ message: "bad input!!!" })
      return res.status(404).json({ err: msgErrors });
    }

    // Create new post with Schema and save in mongoDB
    const newPost = new Post({
      title: req.body.title,
      text: req.body.text,
      author: req.userAuth.id,
      hidden: req.body.hidden,
    });

    await newPost.save();

    return res.status(200).json({
      // post: newPost,
      msg: "Post was created",
    });
  },
];

exports.update_post = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Post title field must not be empty!")
    .isLength(POST_TITLE_LENGTH)
    .withMessage(`Post title must contain ${POST_TITLE_LENGTH} letters!`),
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Post body field must not be empty!")
    .isLength(POST_BODY_LENGTH)
    .withMessage(`Post body must contain ${POST_BODY_LENGTH} letters!`),
  async (req, res) => {
    try {
      // check authorized user exists
      if (!req.userAuth)
        return res.status(401).json({ err: "Unauthorized user" });

      // get existing post from db
      const post = await Post.findOne({ _id: req.params.postId }).exec();

      // check post exists
      if (!post) return res.status(404).json({ err: "Post doesn't exist" });

      const authorId = post.author._id;

      // Other user post. YOu cannot change utr
      if (req.userAuth.id.toString() !== authorId.toString())
        return res.status(401).json({ err: "Unauthorized user" });

      const result = validationResult(req);

      // check is validation correct
      if (!result.isEmpty()) {
        const msgErrors = result.errors.map((err) => err.msg);
        return res.status(404).json({ err: msgErrors });
      }

      // Update post properties and save them in db
      post.title = req.body.title;
      post.text = req.body.text;
      post.hidden = Boolean(req.body.hidden);

      await post.save();

      return res.status(200).json({ msg: "Post has been updated" });
    } catch (err) {
      if (err.name === "CastError")
        return res.status(404).json({ err: "Post doesn't exist" });
    }
  },
];

exports.post_delete = async (req, res) => {
  try {
    if (!req.userAuth)
      return res.status(401).json({ err: "Unauthorized user" });

    const post = await Post.findById(req.params.postId, "title").exec();

    if (!post) return res.status(404).json({ err: "post doesn't exist" });

    const authorId = post.author._id;

    if (req.userAuth.id.toString() !== authorId.toString())
      return res.status(400).json({ err: "Unauthorized user" });

    await Promise.all([
      post.deleteOne(),
      Comment.deleteMany({ post: req.params.postId }),
    ]);

    return res.status(200).json({ message: "Post has been removed!" });
  } catch (err) {
    if (err.name === "CastError")
      return res.status(404).json({ err: "Post doesn't exist" });
  }
};

exports.post_detail = async (req, res) => {
  // const post = await Post.findById(req.params.postId).exec();

  const [post, commentsByPost] = await Promise.all([
    Post.findById(req.params.postId, "title text author timeStamp").populate(
      "author",
      "nickname"
    ),
    Comment.find({ post: req.params.postId }, "text timestamp").populate(
      "author",
      "nickname"
    ),
  ]);

  if (!post) return res.status(404).json({ err: "Post doesn't exist" });

  return res.status(200).json({ post, comments: commentsByPost });
};

exports.post_list = async (req, res) => {
  // get all posts
  const posts = await Post.find({ hidden: false }, "title author timeStamp")
    .sort({ timeStamp: 1 })
    .populate("author", "nickname")
    .exec();

  // create posts per query page
  const limit = POSTS_PER_PAGE;

  const page = Number(req.query.page) || 1;

  const start = (page - 1) * limit;

  const end = page * limit;

  const slicePosts = posts.slice(start, end);

  return res.status(200).json({ posts: slicePosts, page, limit });
};
