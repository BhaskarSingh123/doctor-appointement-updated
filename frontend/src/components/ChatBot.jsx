import React, { useState, useRef, useEffect } from "react";

const ChatBot = () => {

  const [isOpen, setIsOpen] = useState(false);

  const [userInput, setUserInput] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello 👋 How can I help you today?"
    }
  ]);

  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto Scroll
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);

  const sendMessage = async () => {

    if (!userInput.trim()) return;

    const userMessage = {
      sender: "user",
      text: userInput
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {

      const res = await fetch(
        `${backendUrl}/api/ai/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            message: userInput
          })
        }
      );

      const data = await res.json();

      const botMessage = {
        sender: "bot",
        text:
          data.reply ||
          "Sorry, AI is unavailable right now."
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {

      console.log(error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Server error. Please try again later."
        }
      ]);
    }

    setLoading(false);

    setUserInput("");
  };

  return (

    <div>

      {/* Floating Chat Button */}
      <button

        onClick={() => setIsOpen(!isOpen)}

        style={{
          position: "fixed",

          bottom: "20px",

          right: "20px",

          width: "65px",

          height: "65px",

          borderRadius: "50%",

          border: "none",

          background: "#2563eb",

          color: "white",

          fontSize: "28px",

          cursor: "pointer",

          zIndex: 1000,

          boxShadow: "0 6px 20px rgba(0,0,0,0.25)"
        }}
      >
        💬
      </button>

      {/* Chat Window */}
      {
        isOpen && (

          <div
            style={{

              position: "fixed",

              bottom: "95px",

              right: "20px",

              width: "90vw",

              maxWidth: "370px",

              height: "75vh",

              maxHeight: "520px",

              background: "white",

              borderRadius: "18px",

              boxShadow:
                "0 10px 30px rgba(0,0,0,0.25)",

              display: "flex",

              flexDirection: "column",

              overflow: "hidden",

              zIndex: 1000
            }}
          >

            {/* Header */}
            <div
              style={{
                background: "#2563eb",

                color: "white",

                padding: "16px",

                fontWeight: "bold",

                fontSize: "18px"
              }}
            >
              🏥 AI Medical Assistant
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,

                padding: "15px",

                overflowY: "auto",

                background: "#f5f7fb"
              }}
            >

              {
                messages.map((msg, index) => (

                  <div
                    key={index}

                    style={{
                      display: "flex",

                      justifyContent:
                        msg.sender === "user"
                          ? "flex-end"
                          : "flex-start",

                      marginBottom: "12px"
                    }}
                  >

                    <div
                      style={{
                        maxWidth: "75%",

                        padding: "12px 14px",

                        borderRadius: "15px",

                        background:
                          msg.sender === "user"
                            ? "#2563eb"
                            : "#e5e7eb",

                        color:
                          msg.sender === "user"
                            ? "white"
                            : "black",

                        fontSize: "14px",

                        lineHeight: "1.5"
                      }}
                    >
                      {msg.text}
                    </div>

                  </div>

                ))
              }

              {
                loading && (

                  <div
                    style={{
                      color: "gray",

                      fontSize: "14px"
                    }}
                  >
                    AI is typing...
                  </div>

                )
              }

              <div ref={messagesEndRef}></div>

            </div>

            {/* Input Area */}
            <div
              style={{
                display: "flex",

                padding: "12px",

                borderTop: "1px solid #ddd",

                background: "white"
              }}
            >

              <input

                type="text"

                placeholder="Ask your health question..."

                value={userInput}

                onChange={(e) =>
                  setUserInput(e.target.value)
                }

                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}

                style={{
                  flex: 1,

                  padding: "12px",

                  borderRadius: "10px",

                  border: "1px solid #ccc",

                  outline: "none",

                  fontSize: "14px"
                }}
              />

              <button

                onClick={sendMessage}

                style={{
                  marginLeft: "10px",

                  padding: "12px 16px",

                  border: "none",

                  borderRadius: "10px",

                  background: "#2563eb",

                  color: "white",

                  cursor: "pointer",

                  fontWeight: "bold"
                }}
              >
                Send
              </button>

            </div>

          </div>
        )
      }

    </div>
  );
};

export default ChatBot;