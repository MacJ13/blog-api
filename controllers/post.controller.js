const Post = require("../models/post.model");
const Comment = require("../models/comment.model");

const { body } = require("express-validator");

const {
  POST_TITLE_LENGTH,
  POST_BODY_LENGTH,
  POSTS_PER_PAGE,
} = require("../configs/main.config");
const validateResult = require("../middlewares/validateResult");
const postService = require("../services/post.service");

exports.post_create = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Post Title field must not be empty!")
    .isLength(POST_TITLE_LENGTH)
    .withMessage(`Post Title must contain ${POST_TITLE_LENGTH} letters!`),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Post body must not be empty!")
    .isLength(POST_BODY_LENGTH)
    .withMessage(`Post body must contain ${POST_BODY_LENGTH} letters!`)
    .escape(),
  validateResult,
  async (req, res) => {
    // check authorized user exists
    if (!req.userAuth)
      // user is undefined - unauthorized
      return res
        .status(401)
        .json({ error: "Unauthorized user", status: "error", code: 401 });

    // Create new post with Schema and save in mongoDB
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      author: req.userAuth.id,
      hidden: req.body.hidden,
    });

    await newPost.save();

    return res.status(200).json({
      // post: newPost,
      msg: "Post was created successfully",
      status: "success",
      code: 201,
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
  body("content")
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
        return res
          .status(401)
          .json({ error: "unathorized user", status: "error", code: 401 });

      // get existing post from db
      const post = await Post.findOne({ _id: req.params.postId }).exec();

      // check post exists
      if (!post)
        return res
          .status(404)
          .json({ msg: "post doesn't exist", status: "error", code: 404 });

      const authorId = post.author._id;

      // Other user post. YOu cannot change utr
      if (req.userAuth.id.toString() !== authorId.toString())
        return res
          .status(401)
          .json({ error: "unathorized user", status: "error", code: 401 });

      // Update post properties and save them in db
      post.title = req.body.title;
      post.content = req.body.content;
      post.hidden = Boolean(req.body.hidden);

      await post.save();

      return res
        .status(200)
        .json({ msg: "Post has been updated!", status: "success", code: 200 });
    } catch (err) {
      if (err.name === "CastError")
        return res
          .status(404)
          .json({ msg: "post doesn't exist", status: "error", code: 404 });
    }
    return res
      .status(500)
      .json({ msg: "internal server error", status: "error", code: 500 });
  },
];

exports.post_delete = async (req, res) => {
  try {
    if (!req.userAuth)
      return res
        .status(401)
        .json({ msg: "unauthorized user", status: "error", code: 403 });

    const post = await Post.findById(req.params.postId, "title author").exec();

    if (!post)
      return res
        .status(404)
        .json({ error: "Post doesn't exist", code: 404, status: "error" });

    const authorId = post.author._id;

    if (req.userAuth.id.toString() !== authorId.toString())
      return res
        .status(400)
        .json({ msg: "unauthorized user", status: "error", code: 403 });

    await Promise.all([
      post.deleteOne(),
      Comment.deleteMany({ post: req.params.postId }),
    ]);
    return res
      .status(200)
      .json({ msg: "Post has been removed!", status: "success", code: 200 });
  } catch (err) {
    if (err.name === "CastError")
      return res
        .status(404)
        .json({ error: "Post doesn't exist", code: 404, status: "error" });

    return res
      .status(500)
      .json({ msg: "internal server error", status: "error", code: 500 });
  }
};

exports.post_detail = async (req, res) => {
  try {
    const [post, commentsByPost] = await Promise.all([
      Post.findById(req.params.postId).populate("author", "nickname"),
      Comment.find({ post: req.params.postId }, "comment timestamp")
        .populate("author", "nickname")
        .sort({ timestamp: -1 }),
    ]);

    if (!post) return res.status(404).json({ error: "Post doesn't exist" });

    return res.status(200).json({ post, comments: commentsByPost });
  } catch (err) {
    if (err.name === "CastError")
      return res.status(404).json({ error: "Post doesn't exist" });
  }
};

exports.post_list = async (req, res) => {
  try {
    // get current page
    const page = Number(req.query.page) || 1;

    // get posts
    const posts = await postService.getPostsByQuery(req.query, page);

    if (!posts) {
      return res.status(404).json({
        error: `User '${req.query.user}' doesn't exist`,
        code: 404,
        status: "error",
      });
    }

    return res.status(200).json({ posts, page, limit: POSTS_PER_PAGE });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.logged_user_post_list = async (req, res) => {
  console.log(req.userAuth);

  const page = Number(req.query.page) || 1;

  const skip = (page - 1) * POSTS_PER_PAGE;

  try {
    const { id } = req.userAuth;
    const userPosts = await Post.find({ author: id }, "title timeStamp")
      .limit(POSTS_PER_PAGE)
      .skip(skip)
      .sort({ timeStamp: -1 })
      .exec();

    return res
      .status(200)
      .json({ posts: userPosts, page, limit: POSTS_PER_PAGE });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
