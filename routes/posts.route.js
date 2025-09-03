const express = require("express");

const router = express.Router();
const postController = require("../controllers/post.controller");

router.get("/", postController.post_list);

router.get("/my-posts", postController.logged_user_post_list);

module.exports = router;
