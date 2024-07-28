const { COMMENT_LENGTH } = require("../configs/main.config");
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const { body, validationResult } = require("express-validator");

exports.comment_add = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Comment not must be empty!")
    .isLength(COMMENT_LENGTH)
    .withMessage(`Comment must contain at least ${COMMENT_LENGTH} characters`),
  async (req, res) => {
    try {
      // check authorized user exists
      if (!req.userAuth)
        return res.status(401).json({ err: "Unauthorized user" });

      const post = await Post.findById(req.params.postId).exec();

      if (!post) return res.status(404).json({ err: "Post doesn't exist" });

      // check is validation correct
      const result = validationResult(req);

      if (!result.isEmpty()) {
        const msgErrors = result.errors.map((err) => err.msg);
        return res.status(404).json({ err: msgErrors });
      }

      const newComment = new Comment({
        text: req.body.text,
        post: req.params.postId,
        author: req.userAuth.id,
      });

      await newComment.save();

      return res.status(200).json({ message: "Comment has been added" });
    } catch (err) {
      if (err.name === "CastError")
        return res.status(404).json({ err: "Post doesn't exist" });
    }
  },
];

exports.comment_edit = async (req, res) => {
  try {
    if (!req.body.text) return res.status(400).json({ msg: "text was empty!" });

    const comment = await Comment.findById(req.params.commentId).exec();

    // console.log({ comment });
    // console.log({ commentAuthor: comment.author.toString() });
    comment.text = req.body.text;

    const commentAuthorId = comment.author.toString();

    if (commentAuthorId !== req.userAuth.id)
      return res
        .status(400)
        .json({ message: "You cannot remove other user comment!" });

    await comment.save();

    return res.status(200).json({ msg: "comment has been updated" });
  } catch (err) {
    return res.status(404).json({ msg: "comment doesn't exist!" });
  }
};

exports.comment_delete = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    const commentAuthorId = comment.author.toString();

    if (commentAuthorId !== req.userAuth.id)
      return res
        .status(400)
        .json({ message: "You cannot remove other user comment!" });

    await comment.deleteOne();

    return res.status(200).json({ msg: "comment has been deleted" });
  } catch (err) {
    return res.status(404).json({ msg: "comment doesn't exist!" });
  }
};
