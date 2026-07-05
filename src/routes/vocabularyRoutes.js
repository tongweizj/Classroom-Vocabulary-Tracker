const express = require("express");
const controller = require("../controllers/vocabularyController");

const router = express.Router();

router.get("/", controller.listAll);
router.patch("/:id/familiarity", controller.updateFamiliarity);

module.exports = router;
