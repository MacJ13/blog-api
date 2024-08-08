const Post = require("../models/post.model");
const Comment = require("../models/comment.model");

const { body } = require("express-validator");

const {
  POST_TITLE_LENGTH,
  POST_BODY_LENGTH,
  POSTS_PER_PAGE,
} = require("../configs/main.config");
const validateResult = require("../middlewares/validateResult");

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
  validateResult,
  async (req, res) => {
    // check authorized user exists
    if (!req.userAuth)
      // user is undefined - unauthorized
      return res.status(401).json({ err: "Unauthorized user" });

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

  validateResult,
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
  try {
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
  } catch (err) {
    if (err.name === "CastError")
      return res.status(404).json({ err: "Post doesn't exist" });
  }
};

exports.post_list = async (req, res) => {
  // get all posts

  // get current page
  const page = Number(req.query.page) || 1;

  // skip first n documents depending on current page
  const skip = (page - 1) * POSTS_PER_PAGE;

  // find posts on db
  const posts = await Post.find({ hidden: false }, "title author timeStamp")
    .limit(POSTS_PER_PAGE)
    .skip(skip)
    .sort({ timeStamp: 1 })
    .populate("author", "nickname")
    .exec();

  return res.status(200).json({ posts, page, limit: POSTS_PER_PAGE });
};
