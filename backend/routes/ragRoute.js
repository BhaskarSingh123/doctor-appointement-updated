import express from "express";

import upload
from "../middleware/uploadMiddleware.js";

import uploadRagDocument
from "../controllers/ragController.js";

const ragRouter =
  express.Router();

ragRouter.post(

  "/upload",

  upload.single("pdf"),

  uploadRagDocument
);

export default ragRouter;