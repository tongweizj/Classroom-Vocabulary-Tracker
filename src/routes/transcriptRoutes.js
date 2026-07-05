const express = require("express");
const multer = require("multer");
const controller = require("../controllers/transcriptController");

const router = express.Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/plain" || file.originalname.endsWith(".txt")) {
      cb(null, true);
    } else {
      cb(new Error("Only .txt files are allowed."));
    }
  },
});

router.get("/", controller.get);
router.post("/", controller.createOrUpdate);
router.put("/", controller.update);
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum size is 10MB." });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, controller.upload);

module.exports = router;
