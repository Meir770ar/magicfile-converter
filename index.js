const express = require('express');
const multer = require('multer');
const PDFMerger = require('pdf-merger-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: '/srv/converter/input' });

// בדיקה בסיסית
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '🔥 MagicFile.ai Merge API is running (from Docker)' });
});

// פונקציית מיזוג PDF
app.post('/merge', upload.array('files'), async (req, res) => {
    const merger = new PDFMerger();
    try {
        for (const file of req.files) {
            await merger.add(file.path);
        }
        const outputFileName = `merged-${uuidv4()}.pdf`;
        const outputPath = `/srv/converter/output/${outputFileName}`;
        await merger.save(outputPath);

        // מחיקת קבצים זמניים אחרי המיזוג
        req.files.forEach(f => fs.unlinkSync(f.path));

        res.json({ download_url: `https://api.magicfile.ai/output/${outputFileName}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'שגיאה במיזוג הקבצים' });
    }
});

// מאזין
app.listen(3000, () => {
    console.log('🚀 MagicFile.ai API running on port 3000');
});
