const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 4003;

const DATA_FILE = "./data/books.json";
const UPLOADS_DIR = path.join(__dirname, "uploads");

app.use(cors());
app.use(bodyParser.json());

// Serve static files from /uploads
app.use("/uploads", express.static(UPLOADS_DIR));
console.log(`📁 Serving static files from: ${UPLOADS_DIR}`);

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
  console.log("📁 Uploads directory created.");
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`📥 Saving file "${file.originalname}" to "${UPLOADS_DIR}"`);
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    console.log(`📛 Generated filename: ${uniqueName}`);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// GET all books
app.get("/books", (req, res) => {
  console.log("🔍 GET /books request received.");
  fs.readFile(DATA_FILE, "utf-8", (err, data) => {
    if (err) {
      console.error("❌ Error reading books.json:", err);
      return res.status(500).json({ error: "Failed to read file." });
    }
    try {
      const books = JSON.parse(data || "[]");
      console.log(`📚 Returning ${books.length} books.`);
      res.json(books);
    } catch (parseErr) {
      console.error("❌ JSON parsing error:", parseErr);
      res.status(500).json({ error: "Invalid JSON format in data file." });
    }
  });
});

// POST to add a new book
app.post("/books", upload.fields([{ name: "image" }, { name: "file" }]), (req, res) => {
  try {
    console.log("📝 POST /books received.");
    console.log("📦 Body:", req.body);
    console.log("📁 Files:", req.files);

    const { title, author, link } = req.body;
    if (!title) {
      console.warn("⚠️ Missing required field: title");
      return res.status(400).json({ error: "Title is required." });
    }

    const image = req.files?.image?.[0];
    const file = req.files?.file?.[0];

    const imageURL = image ? `http://localhost:${PORT}/uploads/${image.filename}` : null;
    const fileURL = file ? `http://localhost:${PORT}/uploads/${file.filename}` : null;

    const newBook = {
      title,
      author,
      link,
      imageURL,
      fileURL,
    };

    console.log("📘 New Book Object:", newBook);

    fs.readFile(DATA_FILE, "utf-8", (err, data) => {
      if (err) {
        console.error("❌ Error reading data file:", err);
        return res.status(500).json({ error: "Failed to read data file." });
      }

      let books = [];
      try {
        books = data ? JSON.parse(data) : [];
      } catch (parseErr) {
        console.error("❌ Error parsing data file:", parseErr);
        return res.status(500).json({ error: "Failed to parse books data." });
      }

      books.unshift(newBook);

      fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2), (err) => {
        if (err) {
          console.error("❌ Error writing to data file:", err);
          return res.status(500).json({ error: "Failed to save book." });
        }
        console.log("✅ Book successfully saved.");
        res.json(newBook);
      });
    });
  } catch (err) {
    console.error("❌ Unexpected error in POST /books:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
