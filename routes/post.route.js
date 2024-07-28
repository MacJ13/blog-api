const express = require("express");

const router = express.Router();
const postController = require("../controllers/post.controller");
const commentController = require("../controllers/comment.controller");
router.post("/create", postController.post_create);

// router.get("/all", postController.post_list);

router.post("/:postId/comment", commentController.comment_add);

router.get("/:postId", postController.post_detail);

router.put("/:postId", postController.update_post);

router.delete("/:postId", postController.post_delete);

module.exports = router;
