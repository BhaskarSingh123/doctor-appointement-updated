import mongoose from "mongoose";

const ragDocumentSchema =
  new mongoose.Schema({

    fileHash: {
      type: String,
      required: true,
      unique: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  });

const RagDocument =
  mongoose.model(
    "RagDocument",
    ragDocumentSchema
  );

export default RagDocument;