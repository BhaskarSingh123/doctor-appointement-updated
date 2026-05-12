import ragChat
from "../services/ragChat.js";

const chatWithAI = async (req, res) => {

  try {

    const { message } = req.body;

    const reply =
      await ragChat(message);

    res.json({

      success: true,

      reply
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: "RAG Error"
    });
  }
};

export default chatWithAI;