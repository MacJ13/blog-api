const express = require("express");

const router = express.Router();
const postController = require("../controllers/post.controller");

router.post("/create", postController.post_create);

router.get("/all", postController.post_list);

router.post("/:postId/comment/add", postController.add_comment);

router.get("/:postId", postController.post_detail);

router.put("/:postId", postController.update_post);

router.delete("/:postId", postController.post_delete);

module.exports = router;
