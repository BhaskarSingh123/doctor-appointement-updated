import axios from "axios";

import embeddings from "./embeddings.js";

import pineconeIndex from "./pinecone.js";

const retrieveDocs = async (query) => {

  const queryVector =
    await embeddings.embedQuery(query);

  const response = await axios.post(

    `https://${process.env.PINECONE_INDEX_HOST}/query`,

    {

      vector: queryVector,

      topK: 5,

      includeMetadata: true
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

  return response.data.matches;
};

export default retrieveDocs;