import axios from "axios";

import retrieveDocs
from "./retriever.js";

// ==============================
// CHAT HISTORY
// ==============================

const History = [];

// ==============================
// QUERY REWRITER
// ==============================

async function transformQuery(question) {

  // Convert history into OpenAI format
  const formattedHistory = History.map((msg) => ({

    role:
      msg.role === "model"
        ? "assistant"
        : msg.role,

    content:
      msg.parts[0].text
  }));

  // Add latest question
  formattedHistory.push({

    role: "user",

    content: question
  });

  const response = await axios.post(

    "https://openrouter.ai/api/v1/chat/completions",

    {

      model:
        "openai/gpt-3.5-turbo",

      messages: [

        {
          role: "system",

          content: `
You are a query rewriting assistant.

Convert follow-up questions into complete standalone questions.

Examples:

User: What is hypertension?
User: Explain in detail

Rewritten:
Explain hypertension in detail.

User: What is diabetes?
User: Give symptoms

Rewritten:
Give symptoms of diabetes.

ONLY output rewritten question.
`
        },

        ...formattedHistory
      ]
    },

    {

      headers: {

        Authorization:
          `Bearer ${process.env.OPENROUTER_API_KEY}`,

        "Content-Type":
          "application/json"
      }
    }
  );

  const rewrittenQuery =
    response.data
      .choices[0]
      .message
      .content
      .trim();

  console.log(
    "\nRewritten Query:",
    rewrittenQuery
  );

  return rewrittenQuery;
}

// ==============================
// MAIN RAG CHAT
// ==============================

const ragChat = async (question) => {

  // ==============================
  // REWRITE FOLLOW-UP QUERY
  // ==============================

  const rewrittenQuery =
    await transformQuery(question);

  // ==============================
  // RETRIEVE CONTEXT
  // ==============================

  const searchResults =
    await retrieveDocs(rewrittenQuery);

  // Build context
  const context =
    searchResults
      .map(match => match.metadata.text)
      .join("\n\n---\n\n");

  console.log("\nContext Retrieved");

  // ==============================
  // STORE USER MESSAGE
  // ==============================

  History.push({

    role: "user",

    parts: [{ text: question }]
  });

  // ==============================
  // FINAL ANSWER GENERATION
  // ==============================

  const response = await axios.post(

    "https://openrouter.ai/api/v1/chat/completions",

    {

      model:
        "openai/gpt-3.5-turbo",

      messages: [

        {
          role: "system",

          content: `
You are a healthcare AI assistant.

Answer ONLY using the provided medical context.

Rules:
- concise
- educational
- professional

If answer is not found:
say:
"I could not find the answer in the medical documents."

Context:
${context}
`
        },

        ...History.map((msg) => ({

          role:
            msg.role === "model"
              ? "assistant"
              : msg.role,

          content:
            msg.parts[0].text
        }))
      ]
    },

    {

      headers: {

        Authorization:
          `Bearer ${process.env.OPENROUTER_API_KEY}`,

        "Content-Type":
          "application/json"
      }
    }
  );

  const finalAnswer =
    response.data
      .choices[0]
      .message
      .content;

  // ==============================
  // STORE MODEL RESPONSE
  // ==============================

  History.push({

    role: "model",

    parts: [{
      text: finalAnswer
    }]
  });

  return finalAnswer;
};

export default ragChat;