import fs from "fs";

import crypto from "crypto";

import RagDocument
from "../models/ragDocumentModel.js";

import indexPdfToPinecone
from "../services/ragIndexer.js";

const uploadRagDocument =
async (req, res) => {

  try {

    const file = req.file;

    if (!file) {

      return res.json({

        success: false,

        message: "No PDF uploaded"
      });
    }

    console.log(
      "PDF Uploaded:",
      file.originalname
    );

    // ==========================
    // GENERATE SHA-256 HASH
    // ==========================

    const fileBuffer =
      fs.readFileSync(file.path);

    const fileHash =
      crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");

    console.log(
      "Generated Hash:",
      fileHash
    );

    // ==========================
    // CHECK DUPLICATE
    // ==========================

    const existingDoc =
      await RagDocument.findOne({

        fileHash
      });

    // DUPLICATE PDF
    if(existingDoc){

      // DELETE TEMP FILE
      if(fs.existsSync(file.path)){

        fs.unlinkSync(file.path);

        console.log(
          "Duplicate PDF deleted"
        );
      }

      return res.json({

        success:false,

        message:
          "PDF already indexed"
      });
    }

    // ==========================
    // INDEX PDF TO PINECONE
    // ==========================

    await indexPdfToPinecone(
      file.path
    );

    // ==========================
    // SAVE METADATA
    // ==========================

    await RagDocument.create({

      fileHash,

      fileName:
        file.originalname
    });

    // ==========================
    // DELETE TEMP FILE
    // ==========================

    setTimeout(() => {

      try {

        if(fs.existsSync(file.path)){

          fs.unlinkSync(file.path);

          console.log(
            "Temporary PDF deleted"
          );
        }

      } catch(err){

        console.log(
          "File deletion error:",
          err
        );
      }

    }, 3000);

    res.json({

      success:true,

      message:
        "PDF uploaded and indexed successfully"
    });

  } catch(error){

    console.log(error);

    res.json({

      success:false,

      message:
        "Upload failed"
    });
  }
};

export default uploadRagDocument;