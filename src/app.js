const express = require("express");
const cors = require("cors");
const path = require("path");
const importRoutes = require("./routes/importRoutes");
const tableRoutes = require("./routes/tableRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/import", importRoutes);
app.use("/api/tables", tableRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});