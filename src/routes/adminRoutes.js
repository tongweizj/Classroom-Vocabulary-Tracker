const express = require("express");
const controller = require("../controllers/adminController");

const router = express.Router();

router.get("/courses", controller.coursesPage);
router.get("/lessons", controller.lessonsPage);
router.get("/lessons/:id", controller.lessonDetailPage);
router.get("/lessons/:id/vocabulary", controller.lessonVocabPage);
router.get("/vocabulary", controller.vocabularyPage);
router.get("/learning-queue", controller.learningQueuePage);
router.get("/prompts", controller.promptsPage);
router.get("/vocabulary/:id/study", controller.vocabStudyPage);

module.exports = router;
