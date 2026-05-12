import React, { useState } from "react";
import axios from "axios";


const AdminPdfUpload = () => {

  const [pdf, setPdf] = useState(null);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const uploadPdf = async () => {

    if (!pdf) {

      setMessage("Please select a PDF file");

      return;
    }

    try {

      setLoading(true);

      setMessage("");

      const formData = new FormData();

      formData.append("pdf", pdf);

      const response = await axios.post(

        `${backendUrl}/api/rag/upload`,

        formData,

        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      if (response.data.success) {

        setMessage(response.data.message);

      } else {

        setMessage(response.data.message);
      }

    } catch (error) {

      console.log(error);

      setMessage(

        error.response?.data?.message ||

        "Upload failed"
      );

    } finally {

      setLoading(false);
    }
  };

  return (

    <div className="w-full min-h-screen bg-[#F8F9FD] p-8">

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">

        {/* Heading */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold text-blue-600">

            📄 Upload Medical PDF
          </h1>

          <p className="text-gray-500 mt-2">

            Upload healthcare documents for AI
            vector indexing and RAG retrieval.
          </p>

        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-blue-300 rounded-2xl p-10 bg-blue-50 flex flex-col items-center justify-center">

          <input

            type="file"

            accept="application/pdf"

            onChange={(e) =>
              setPdf(e.target.files[0])
            }

            className="mb-5"
          />

          {

            pdf && (

              <div className="text-center">

                <p className="text-lg font-semibold text-gray-700">

                  Selected File:
                </p>

                <p className="text-blue-600 mt-1">

                  {pdf.name}
                </p>

              </div>
            )
          }

        </div>

        {/* Upload Button */}
        <button

          onClick={uploadPdf}

          disabled={loading}

          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 transition duration-300 text-white py-4 rounded-xl font-semibold text-lg"

        >
          {

            loading

              ? "Uploading & Indexing PDF..."

              : "Upload PDF"
          }
        </button>

        {/* Response Message */}
        {

          message && (

            <div className="mt-6 p-4 rounded-xl bg-gray-100 text-center text-gray-700 font-medium">

              {message}
            </div>
          )
        }

        {/* Features */}
        <div className="mt-10 bg-gray-50 rounded-xl p-6">

          <h2 className="text-xl font-bold mb-4 text-gray-700">

            🚀 Features
          </h2>

          <ul className="space-y-3 text-gray-600">

            <li>
              ✅ SHA-256 duplicate detection
            </li>

            <li>
              ✅ Automatic PDF chunking
            </li>

            <li>
              ✅ HuggingFace embeddings
            </li>

            <li>
              ✅ Pinecone vector indexing
            </li>

            <li>
              ✅ Conversational RAG support
            </li>

            <li>
              ✅ Semantic healthcare retrieval
            </li>

          </ul>

        </div>

      </div>

    </div>
  );
};

export default AdminPdfUpload;