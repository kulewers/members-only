const express = require("express");
const router = express.Router();

const post_controller = require("../controllers/postController");

router.get("/create", post_controller.post_create_get);
router.post("/create", post_controller.post_create_post);
router.get("/delete/:id", post_controller.post_delete_get);
router.post("/delete/:id", post_controller.post_delete_post);

module.exports = router;
