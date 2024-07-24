const Comment = require("../models/comment.model");

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
