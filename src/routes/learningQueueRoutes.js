const express = require("express");
const controller = require("../controllers/learningQueueController");

const router = express.Router();

router.post("/generate", controller.generate);
router.patch("/", controller.updateStatus);

module.exports = router;
