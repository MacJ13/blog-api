const express = require("express");

const router = express.Router();

const userRouter = require("./user.route");
const postRouter = require("./post.route");
const commentRouter = require("./comment.route");

const postsRouter = require("./posts.route");

// const { checkAuth } = require("../../services/passport.jwt.service");
const checkAuth = require("../middlewares/checkAuth.middleware");

router.use(checkAuth);
router.use("/user", userRouter);
router.use("/post", postRouter);

router.use("/posts", postsRouter);
router.use("/comment", commentRouter);

module.exports = router;
