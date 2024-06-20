const Comment = require("../models/comment.model");

exports.comment_edit = async (req, res) => {
  try {
    if (!req.body.text) return res.status(404).json({ msg: "text was empty!" });
    const comment = await Comment.findById(req.params.commentId);

    comment.text = req.body.text;

    await comment.save();

    return res.status(200).json({ msg: "comment has been updated" });
  } catch (err) {
    return res.status(404).json({ msg: "comment doesn't exist!" });
  }
};

exports.comment_delete = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    await comment.deleteOne();

    return res.status(200).json({ msg: "comment has been deleted" });
  } catch (err) {
    return res.status(404).json({ msg: "comment doesn't exist!" });
  }
};