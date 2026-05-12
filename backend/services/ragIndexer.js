import * as dotenv from 'dotenv';
dotenv.config();

import { PDFLoader }
from '@langchain/community/document_loaders/fs/pdf';

import { RecursiveCharacterTextSplitter }
from '@langchain/textsplitters';

import {
  HuggingFaceTransformersEmbeddings
}
from "@langchain/community/embeddings/hf_transformers";

import axios from "axios";

// ======================================
// MAIN INDEXING FUNCTION
// ======================================

const indexPdfToPinecone =
async (pdfPath) => {

  try {

    console.log(
      "\nStarting PDF indexing...\n"
    );

    // ======================================
    // LOAD PDF
    // ======================================

    const pdfLoader =
      new PDFLoader(pdfPath);

    const rawDocs =
      await pdfLoader.load();

    console.log("PDF loaded");

    console.log(
      "Raw Docs Length:",
      rawDocs.length
    );

    // ======================================
    // CHUNKING
    // ======================================

    const textSplitter =
      new RecursiveCharacterTextSplitter({

        chunkSize: 300,

        chunkOverlap: 50,
      });

    const chunkedDocs =
      await textSplitter.splitDocuments(
        rawDocs
      );

    console.log(
      "Chunking completed"
    );

    console.log(
      "Chunked Docs Length:",
      chunkedDocs.length
    );

    // STOP IF EMPTY
    if (!chunkedDocs.length) {

      console.log(
        "No chunks generated!"
      );

      return;
    }

    // ======================================
    // EMBEDDINGS
    // ======================================

    const embeddings =
      new HuggingFaceTransformersEmbeddings({

        model:
          "Xenova/all-MiniLM-L6-v2"
      });

    console.log(
      "Embeddings loaded"
    );

    // TEST EMBEDDING
    const testEmbedding =
      await embeddings.embedQuery(
        "hello"
      );

    console.log(
      "Embedding generated successfully"
    );

    console.log(
      "Embedding length:",
      testEmbedding.length
    );

    // ======================================
    // BATCH VECTOR UPLOAD
    // ======================================

    const BATCH_SIZE = 50;

    for (

      let batchStart = 0;

      batchStart < chunkedDocs.length;

      batchStart += BATCH_SIZE

    ) {

      const batchDocs =
        chunkedDocs.slice(

          batchStart,

          batchStart + BATCH_SIZE
        );

      const vectors = [];

      for (

        let i = 0;

        i < batchDocs.length;

        i++

      ) {

        const embedding =
          await embeddings.embedQuery(

            batchDocs[i].pageContent
          );

        vectors.push({

          id:
            `doc-${batchStart + i}`,

          values: embedding,

          metadata: {

            text:
              batchDocs[i].pageContent,
          },
        });
      }

      console.log(
        `Uploading batch ${
          batchStart / BATCH_SIZE + 1
        }`
      );

      // ======================================
      // DIRECT PINECONE UPSERT
      // ======================================

      await axios.post(

        `https://${process.env.PINECONE_INDEX_HOST}/vectors/upsert`,

        {
          vectors: vectors
        },

        {
          headers: {

            "Api-Key":
              process.env.PINECONE_API_KEY,

            "Content-Type":
              "application/json"
          }
        }
      );

      console.log(
        `Batch ${
          batchStart / BATCH_SIZE + 1
        } uploaded`
      );
    }

    console.log(
      "\nAll vectors uploaded successfully\n"
    );

  } catch (error) {

    console.log(
      "RAG INDEXING ERROR:",
      error.response?.data || error
    );
  }
};

export default indexPdfToPinecone;