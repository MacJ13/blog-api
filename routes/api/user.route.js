const express = require("express");

const router = express.Router();

const userController = require("../../controllers/user.controller");

router.delete("/:userId", userController.user_delete);

router.get("/:userId", userController.user_detail);

module.exports = router;
