const {
  COMMENT_LENGTH,
  COMMENTS_PER_PAGE,
  POSTS_PER_PAGE,
} = require("../configs/main.config");
const validateResult = require("../middlewares/validateResult");
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const { body } = require("express-validator");

exports.comment_list = async (req, res) => {
  if (!req.userAuth)
    return res
      .status(401)
      .json({ msg: "unauthorized user", status: "error", code: 401 });

  // console.log(req.userAuth);
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * COMMENTS_PER_PAGE;

  // const comments = await Comment.find({ author: req.userAuth.id })
  //   .populate("post", "title author")
  //   .populate("post.author", "nickname")
  //   .sort({ timestamp: -1 })
  //   // .populate("author", "nickname")
  //   // .limit(COMMENTS_PER_PAGE)
  //   // .skip(skip)
  //   .exec();

  const [comments, totalComments] = await Promise.all([
    await Comment.find({ author: req.userAuth.id })
      .populate("post", "title author")
      .populate("post.author", "nickname")
      .sort({ timestamp: -1 })
      .populate("author", "nickname")
      .limit(COMMENTS_PER_PAGE)
      .skip(skip)
      .exec(),
    await Comment.countDocuments({ author: req.userAuth.id }).exec(),
  ]);

  // console.log(comments);
  return res.status(200).json({
    comments,
    totalComments,
    pageNumber: page,
    commentsPerPage: COMMENTS_PER_PAGE,
    status: "success",
    code: 200,
  });
};

exports.comment_list_by_post = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;

    const skip = (page - 1) * POSTS_PER_PAGE;

    const commentsByPost = await Comment.find(
      { post: req.params.postId },
      "comment timestamp"
    )
      // .skip(skip)
      .populate("author", "nickname")
      .sort({ timestamp: -1 })
      .exec();

    if (!commentsByPost)
      return res.status(404).json({ error: "Post doesn't exist" });
    // console.log({ page, skip, commentsByPostLength: commentsLength });
    return res.status(200).json({ comments: commentsByPost });
  } catch (err) {}
};

exports.comment_add = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment not must be empty!")
    .isLength(COMMENT_LENGTH)
    .withMessage(`Comment must contain at least ${COMMENT_LENGTH} characters`),
  validateResult,
  async (req, res) => {
    try {
      // check authorized user exists
      if (!req.userAuth)
        return res
          .status(401)
          .json({ error: "unathorized user", status: "error", code: 401 });

      const post = await Post.findById(req.params.postId).exec();

      if (!post)
        return res
          .status(404)
          .json({ error: "unathorized user", status: "error", code: 401 });

      const newComment = new Comment({
        comment: req.body.comment,
        post: req.params.postId,
        author: req.userAuth.id,
      });

      await newComment.save();

      await newComment.populate("author", "nickname _id");

      return res.status(201).json({
        msg: "Comment has been added",
        status: "success",
        code: 201,
        comment: newComment,
      });
    } catch (err) {
      if (err.name === "CastError")
        return res
          .status(404)
          .json({ status: "error", code: 403, error: "Post doesn't exist" });
    }
  },
];

exports.comment_edit = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment not must be empty!")
    .isLength(COMMENT_LENGTH)
    .withMessage(`Comment must contain at least ${COMMENT_LENGTH} characters`),
  validateResult,
  async (req, res) => {
    try {
      if (!req.userAuth)
        return res
          .status(401)
          .json({ error: "unathorized user", status: "error", code: 401 });

      // get updated comment
      const comment = await Comment.findById(req.params.commentId)
        .populate("author", "nickname _id")
        .exec();
      // get author of comment id
      const commentAuthorId = comment.author._id.toString();
      // console.log({ commentAuthorId, userId: req.userAuth.id });

      // check if author comment is logged user
      if (commentAuthorId !== req.userAuth.id)
        return res
          .status(400)
          .json({ error: "unathorized user", status: "error", code: 400 });

      // Update comment text and save in db
      comment.comment = req.body.comment;
      await comment.save();

      return res.status(200).json({
        msg: "Comment has been edited",
        status: "success",
        code: 200,
        comment,
      });
    } catch (err) {
      if (err.name === "CastError")
        return res.status(404).json({ error: "Comment doesn't exist" });
    }
  },
];

exports.comment_delete = async (req, res) => {
  try {
    if (!req.userAuth)
      return res
        .status(401)
        .json({ error: "unathorized user", status: "error", code: 401 });

    // get deleting comment
    const comment = await Comment.findById(req.params.commentId);

    // get author of comment id
    const commentAuthorId = comment.author.toString();

    // check if author comment is logged user
    if (commentAuthorId !== req.userAuth.id)
      return res
        .status(400)
        .json({ error: "unathorized user", status: "error", code: 400 });

    // remove comment from db
    await comment.deleteOne();

    return res
      .status(200)
      .json({ msg: "Comment has been removed", status: "success", code: 200 });
  } catch (err) {
    if (err.name === "CastError")
      return res.status(404).json({ error: "Post doesn't exist" });
  }
};
