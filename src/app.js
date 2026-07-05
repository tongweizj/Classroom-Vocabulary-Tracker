const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./config/db");
const courseRoutes = require("./routes/courseRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const transcriptRoutes = require("./routes/transcriptRoutes");
const asrCorrectionRoutes = require("./routes/asrCorrectionRoutes");
const vocabularyRoutes = require("./routes/vocabularyRoutes");
const learningQueueRoutes = require("./routes/learningQueueRoutes");
const practiceLogRoutes = require("./routes/practiceLogRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/lessons/:lessonId/transcript", transcriptRoutes);
app.use("/api/asr-corrections", asrCorrectionRoutes);
app.use("/api/vocabulary", vocabularyRoutes);
app.use("/api/learning-queue", learningQueueRoutes);
app.use("/api/practice-logs", practiceLogRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.redirect("/admin/courses");
});

const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();