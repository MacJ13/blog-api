const express = require("express");
const commentController = require("../controllers/comment.controller");

const router = express.Router();

router.put("/:commentId/", commentController.comment_edit);

router.delete("/:commentId", commentController.comment_delete);

module.exports = router;
