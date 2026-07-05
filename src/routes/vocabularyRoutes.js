const express = require("express");
const controller = require("../controllers/vocabularyController");

const router = express.Router();

router.get("/", controller.listAll);
router.get("/:id/study", controller.studyDetail);
router.patch("/:id/familiarity", controller.updateFamiliarity);

module.exports = router;
