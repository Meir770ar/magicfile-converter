const express = require("express");
const multer  = require("multer");
const { v4: uuidv4 } = require("uuid");
const path    = require("path");
const { exec }= require("child_process");
const cors    = require("cors");
const fs      = require("fs");
const PDFMerger = require("pdf-merger-js");

// --- קבועים ---
const IN_DIR  = "/srv/converter/input";
const OUT_DIR = "/srv/converter/output";
const PORT    = process.env.PORT || 3000;

const UPLOADS_DIR_FOR_MERGE       = path.join(__dirname, "uploads");
const MERGED_OUTPUT_DIR_FOR_MERGE = path.join(__dirname, "merged_output");

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
[UPLOADS_DIR_FOR_MERGE, MERGED_OUTPUT_DIR_FOR_MERGE].forEach(dir=>{
  if(!fs.existsSync(dir)){
    fs.mkdirSync(dir,{recursive:true});
    console.log("Created dir:",dir);
  }
});

/* ----------  CONVERT DOCX -> PDF  ---------- */
const convertStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, IN_DIR),
  filename:    (_, file, cb) => cb(null, uuidv4()+path.extname(file.originalname))
});
const uploadConvert = multer({ storage: convertStorage });

app.post("/convert", uploadConvert.single("file"), (req,res)=>{
  console.log("-> /convert");
  if(!req.file){ return res.status(400).json({error:"No file uploaded"}); }

  const target  = req.query.target || "pdf";
  const inFile  = req.file.filename;
  const outFile = `${path.parse(inFile).name}.${target}`;
  // use the dedicated converter container via docker exec
  const cmd     = `docker exec converter-converter-1 unoconv -f ${target} -o /output/${outFile} /input/${inFile}`;

  exec(cmd,(err)=>{
    if(err){
      console.error("Conversion failed:",err);
      return res.status(500).json({error:"Conversion failed",details:err.message});
    }
    res.json({ download_url:`https://api.magicfile.ai/files/${outFile}` });
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

app.get("/api/health",(req,res)=>res.json({status:"OK"}));

app.post("/api/pdf/merge", uploadMerge.array("pdfs",10), async (req,res,next)=>{
  try{
    if(!req.files||req.files.length<2){
      return res.status(400).json({message:"Upload at least two PDFs"});
    }
    const merger = new PDFMerger();
    for(const f of req.files){ await merger.add(f.path); }

    const mergedName=`merged-${uuidv4()}.pdf`;
    const mergedPath=path.join(MERGED_OUTPUT_DIR_FOR_MERGE,mergedName);
    await merger.save(mergedPath);

    res.download(mergedPath,mergedName,()=>{ fs.unlinkSync(mergedPath); });
    req.files.forEach(f=>fs.unlinkSync(f.path));
  }catch(err){ next(err); }
});

/* ----------  GLOBAL ERROR HANDLER  ---------- */
app.use((err,req,res,next)=>{
  console.error("Global error:",err);
  if(res.headersSent) return next(err);
  res.status(500).json({error:err.message||"Server error"});
});

/* ----------  START  ---------- */
app.listen(PORT, ()=>console.log("MagicFile API listening on",PORT));
