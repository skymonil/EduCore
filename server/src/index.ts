import express from "express";
const app = express();
const PORT = 5000;

app.get("/", (req, res) => {
  res.send("LSM Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
