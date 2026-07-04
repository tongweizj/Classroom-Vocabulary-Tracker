const express = require("express");
const cors = require("cors");
const importRoutes = require("./routes/importRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/import", importRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Class Vocabulary Tracker API is running."
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});