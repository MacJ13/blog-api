const express = require("express");

const router = express.Router();

const userController = require("../controllers/user.controller");

router.delete("/:userId", userController.user_delete);

router.get("/:userId", userController.user_detail);

router.put("/password", userController.user_change_password);

module.exports = router;
