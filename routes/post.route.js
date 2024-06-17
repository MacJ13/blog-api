const express = require("express");

const router = express.Router();
const postController = require("../controllers/post.controller");

const { checkAuth } = require("../services/passport.jwt.service");

router.post("/create", checkAuth, postController.post_create);

router.get("/:postId", checkAuth, postController.post_detail);

module.exports = router;
