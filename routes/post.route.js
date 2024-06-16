const express = require("express");

const router = express.Router();
const postController = require("../controllers/post.controller");

const { checkAuth } = require("../services/passport.jwt.service");

router.post("/create", checkAuth, postController.post_create);

module.exports = router;
