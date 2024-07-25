const express = require("express");
const commentController = require("../controllers/comment.controller");

const router = express.Router();

router.put("/:commentId/edit", commentController.comment_edit);

router.delete("/:commentId/delete", commentController.comment_delete);

module.exports = router;
