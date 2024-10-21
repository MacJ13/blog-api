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
    return res.status(401).json({ error: "Unauthorized user" });

  // console.log(req.userAuth);
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * POSTS_PER_PAGE;

  const comments = await Comment.find({ author: req.userAuth.id })
    .limit(COMMENTS_PER_PAGE)
    .skip(skip)
    .exec();

  // console.log(comments);
  return res.status(200).json({ comments });
};

exports.comment_add = [
  body("text")
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
        return res.status(401).json({ error: "Unauthorized user" });

      const post = await Post.findById(req.params.postId).exec();

      if (!post) return res.status(404).json({ error: "Post doesn't exist" });

      const newComment = new Comment({
        text: req.body.text,
        post: req.params.postId,
        author: req.userAuth.id,
      });

      await newComment.save();

      return res.status(200).json({ message: "Comment has been added" });
    } catch (err) {
      if (err.name === "CastError")
        return res.status(404).json({ error: "Post doesn't exist" });
    }
  },
];

exports.comment_edit = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Comment not must be empty!")
    .isLength(COMMENT_LENGTH)
    .withMessage(`Comment must contain at least ${COMMENT_LENGTH} characters`),
  validateResult,
  async (req, res) => {
    try {
      if (!req.userAuth)
        return res.status(401).json({ error: "Unauthorized user" });

      // get updated comment
      const comment = await Comment.findById(req.params.commentId).exec();

      // get author of comment id
      const commentAuthorId = comment.author.toString();

      // check if author comment is logged user
      if (commentAuthorId !== req.userAuth.id)
        return res.status(400).json({ error: "Unauthorized user" });

      // Update comment text and save in db
      comment.text = req.body.text;
      await comment.save();

      return res.status(200).json({ msg: "comment has been updated" });
    } catch (err) {
      if (err.name === "CastError")
        return res.status(404).json({ error: "Post doesn't exist" });
    }
  },
];

exports.comment_delete = async (req, res) => {
  try {
    if (!req.userAuth)
      return res.status(401).json({ error: "Unauthorized user" });

    // get deleting comment
    const comment = await Comment.findById(req.params.commentId);

    // get author of comment id
    const commentAuthorId = comment.author.toString();

    // check if author comment is logged user
    if (commentAuthorId !== req.userAuth.id)
      return res.status(400).json({ error: "Unauthorized user" });

    // remove comment from db
    await comment.deleteOne();

    return res.status(200).json({ msg: "comment has been deleted" });
  } catch (err) {
    return res.status(404).json({ msg: "comment doesn't exist!" });
  }
};
