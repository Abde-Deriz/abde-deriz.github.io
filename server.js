const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Setup multer for file uploads
const upload = multer({ dest: "uploads/temp/" });

app.use(express.static("public"));
// If needed for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint for uploading images
app.post("/upload", upload.array("images", 1000), (req, res) => {
    const folderName = req.body.folderName;
    const uploadPath = path.join(__dirname, "uploads", folderName);

    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const urls = [];

    req.files.forEach((file) => {
        const newFilePath = path.join(uploadPath, file.originalname);
        fs.renameSync(file.path, newFilePath);

        const fileUrl = `http://localhost:${PORT}/uploads/${folderName}/${file.originalname}`;
        urls.push(fileUrl);
    });

    // Save URLs to output.txt
    const outputPath = path.join(uploadPath, "output.txt");
    fs.writeFileSync(outputPath, urls.join("\n"));

    res.sendStatus(200);
});

// Endpoint for downloading output.txt
app.get("/download", (req, res) => {
    const folderName = req.query.folder;

    if (!folderName) {
        return res.status(400).send("Folder name is required.");
    }

    const filePath = path.join(__dirname, "uploads", folderName, "output.txt");

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send("File not found. Make sure the folder exists and images were uploaded.");
    }
});


// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/folders", (req, res) => {
    const uploadsPath = path.join(__dirname, "uploads");

    fs.readdir(uploadsPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error("Error reading uploads directory:", err);
            return res.status(500).send("Error retrieving folders.");
        }

        const folders = files
            .filter((file) => file.isDirectory())
            .map((folder) => folder.name);

        console.log("Folders found:", folders); // Debug log
        res.json(folders);
    });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
