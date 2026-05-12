import {
  HuggingFaceTransformersEmbeddings
}
from "@langchain/community/embeddings/hf_transformers";

const embeddings =
  new HuggingFaceTransformersEmbeddings({

    model:
      "Xenova/all-MiniLM-L6-v2"
  });

export default embeddings;