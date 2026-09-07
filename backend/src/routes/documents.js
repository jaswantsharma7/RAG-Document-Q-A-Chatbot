import { Router } from "express";
import { upload } from "../config/upload.js";
import { ingestPdf } from "../services/documentIngestion.js";
import { deleteDocumentBySourceId } from "../services/vectorStore.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

const router = Router();

router.post(
  "/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const result = await ingestPdf(req.file.path, req.file.originalname);

    logger.info("Document ingested", result);
    res.status(201).json({
      message: "Document processed and indexed successfully.",
      document: result,
    });
  })
);

router.delete(
  "/:sourceId",
  asyncHandler(async (req, res) => {
    const { sourceId } = req.params;
    await deleteDocumentBySourceId(sourceId);
    res.json({ message: "Document removed from the index." });
  })
);

export default router;
