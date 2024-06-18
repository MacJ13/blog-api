const express = require("express");

const router = express.Router();
const postController = require("../../controllers/post.controller");

const { checkAuth } = require("../../services/passport.jwt.service");

router.post("/create", checkAuth, postController.post_create);

router.get("/all", checkAuth, postController.post_list);

router.get("/:postId", checkAuth, postController.post_detail);

router.put("/:postId", checkAuth, postController.update_post);

router.delete("/:postId", checkAuth, postController.post_delete);

module.exports = router;
