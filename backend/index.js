import express from "express";
import fs from "fs";

const app = express();
app.use(express.json());

import cors from "cors";
app.use(cors());

const DATA_FILE = "./data.json";

app.get("/api/data", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log(data);
  res.json(data);
});

app.put("/api/data", (req, res) => {
  try {
    const key = Object.keys(req.body)[0];
    const value = req.body[key];

    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    data[key] = value;

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");

    console.log(`Updated ${key} -> ${JSON.stringify(value)}`);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update data" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(3001, () => console.log(`Server running on port ${PORT}`));
