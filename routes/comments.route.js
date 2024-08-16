const express = require("express");
const commentController = require("../controllers/comment.controller");

const router = express.Router();

router.get("/", commentController.comment_list);

module.exports = router;
