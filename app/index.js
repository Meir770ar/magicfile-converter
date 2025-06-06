const express     = require("express");
const cors        = require("cors");
const multer      = require("multer");
const { v4: uuidv4 } = require("uuid");
const PDFMerger   = require("pdf-merger-js");
const fs          = require("fs");
const path        = require("path");
const { exec }    = require("child_process");

// --- קבועים ---
const IN_DIR  = "/srv/converter/input";
const OUT_DIR = "/srv/converter/output";
const PORT    = process.env.PORT || 3000;

const UPLOADS_DIR_FOR_MERGE       = path.join(__dirname, "uploads");
const MERGED_OUTPUT_DIR_FOR_MERGE = path.join(__dirname, "merged_output");

// simple timestamped logger
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

const app = express();

/* ----------  CORS  ---------- */
const corsOptions = {
  origin: "https://magicfile.ai",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};

app.use(cors(corsOptions));
// handle preflight requests for all routes
app.options(/.*/, cors(corsOptions));

/* ----------  MIDDLEWARES  ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/files", express.static(OUT_DIR));

/* ----------  FOLDERS INIT  ---------- */
[IN_DIR, OUT_DIR, UPLOADS_DIR_FOR_MERGE, MERGED_OUTPUT_DIR_FOR_MERGE].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created dir: ${dir}`);
  }
});

/* ----------  CONVERT DOCX -> PDF  ---------- */
const convertStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, IN_DIR),
  filename:    (_, file, cb) => cb(null, uuidv4()+path.extname(file.originalname))
});
const uploadConvert = multer({ storage: convertStorage });

app.post("/convert", uploadConvert.single("file"), (req, res) => {
  log("POST /convert");
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const target = (req.query.target || "pdf").toLowerCase();
  const inFile = req.file.filename;
  const outFile = `${path.parse(inFile).name}.${target}`;
  const cmd = `docker exec converter-converter-1 unoconv -f ${target} -o /output/${outFile} /input/${inFile}`;

  log(`Running: ${cmd}`);
  exec(cmd, (err, stdout, stderr) => {
    // remove uploaded file regardless of success
    fs.unlink(path.join(IN_DIR, inFile), () => {});

    if (err) {
      log(`Conversion failed: ${stderr || err.message}`);
      return res.status(500).json({ success: false, error: "Conversion failed", details: stderr || err.message });
    }

    log(`Conversion successful: ${outFile}`);
    res.json({ success: true, download_url: `https://api.magicfile.ai/files/${outFile}` });

    // schedule removal of output after 10 minutes to save space
    setTimeout(() => {
      fs.unlink(path.join(OUT_DIR, outFile), () => {
        log(`Cleaned output file: ${outFile}`);
      });
    }, 10 * 60 * 1000);
  });
});

/* ----------  PDF MERGE  ---------- */
const mergeStorage = multer.diskStorage({
  destination: (_,__,cb)=>cb(null,UPLOADS_DIR_FOR_MERGE),
  filename:    (_,file,cb)=>cb(null,`${uuidv4()}-${file.originalname}`)
});
const uploadMerge = multer({
  storage: mergeStorage,
  limits: { fileSize: 25*1024*1024 },
  fileFilter: (_,file,cb)=>{
    return (path.extname(file.originalname).toLowerCase()===".pdf")
      ? cb(null,true)
      : cb(new Error("Only PDF files allowed"),false);
  }
});

app.get("/api/health", (req, res) => {
  log("GET /api/health");
  res.json({ status: "OK", message: "MagicFile API is running" });
});

app.post("/api/pdf/merge", uploadMerge.array("pdfs", 10), async (req, res, next) => {
  log("POST /api/pdf/merge");
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: "Upload at least two PDF files" });
    }

    const merger = new PDFMerger();
    for (const f of req.files) {
      await merger.add(f.path);
    }

    const mergedName = `merged-${uuidv4()}.pdf`;
    const mergedPath = path.join(MERGED_OUTPUT_DIR_FOR_MERGE, mergedName);
    await merger.save(mergedPath);

    log(`Merged PDF created: ${mergedName}`);

    res.download(mergedPath, mergedName, (err) => {
      fs.unlink(mergedPath, () => {});
      if (err) log(`Download error: ${err.message}`);
    });

    req.files.forEach(f => fs.unlink(f.path, () => {}));
  } catch (err) {
    next(err);
  }
});

/* ----------  GLOBAL ERROR HANDLER  ---------- */
app.use((err, req, res, next) => {
  log(`Global error: ${err.message}`);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

/* ----------  START  ---------- */
app.listen(PORT, () => log(`MagicFile API listening on ${PORT}`));
