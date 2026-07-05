const express = require("express");
const controller = require("../controllers/lessonController");
const transcriptController = require("../controllers/transcriptController");
const vocabularyController = require("../controllers/vocabularyController");

const router = express.Router();

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

router.post("/:lessonId/correct", transcriptController.correct);
router.post("/:lessonId/vocabulary/import", vocabularyController.importItems);
router.get("/:lessonId/vocabulary", vocabularyController.listByLesson);

module.exports = router;
