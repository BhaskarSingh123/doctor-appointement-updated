import React, { useState } from "react";
import axios from "axios";

const AdminPdfUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const allowedTypes = [
    "application/pdf",
    "text/csv",
    "application/vnd.ms-excel",
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    setMessage("");
    setMessageType("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!allowedTypes.includes(selectedFile.type)) {
      setFile(null);
      setMessage("Please select only a PDF or CSV file.");
      setMessageType("error");
      return;
    }

    // 10 MB limit
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setMessage("File size must be less than 10 MB.");
      setMessageType("error");
      return;
    }

    setFile(selectedFile);
  };

  const uploadFile = async () => {
    if (!file) {
      setMessage("Please select a PDF or CSV file.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const formData = new FormData();

      // IMPORTANT:
      // Backend should use multer.single("file")
      formData.append("file", file);

      const response = await axios.post(
        `${backendUrl}/api/rag/upload`,
        formData
      );

      if (response.data.success) {
        setMessage(
          response.data.message ||
            `${file.name} uploaded and indexed successfully.`
        );
        setMessageType("success");

        setFile(null);

        // Reset file input
        document.getElementById("rag-file-input").value = "";
      } else {
        setMessage(
          response.data.message || "File processing failed."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error("RAG upload error:", error);

      setMessage(
        error.response?.data?.message ||
          "Upload failed. Please try again."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return "📄";

    if (file.type === "application/pdf") {
      return "📕";
    }

    return "📊";
  };

  const getFileType = () => {
    if (!file) return "";

    if (file.type === "application/pdf") {
      return "PDF Document";
    }

    return "CSV Dataset";
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F9FD] p-8">

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">

        {/* Heading */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold text-blue-600">
            📚 Upload Medical Documents
          </h1>

          <p className="text-gray-500 mt-2">
            Upload PDF or CSV healthcare documents for AI
            vector indexing and RAG retrieval.
          </p>

        </div>

        {/* Supported formats */}
        <div className="grid grid-cols-2 gap-4 mb-8">

          <div className="border rounded-xl p-5 text-center bg-red-50">
            <div className="text-4xl mb-2">
              📕
            </div>

            <h3 className="font-bold text-gray-700">
              PDF
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Medical reports, guidelines,
              research papers
            </p>
          </div>

          <div className="border rounded-xl p-5 text-center bg-green-50">
            <div className="text-4xl mb-2">
              📊
            </div>

            <h3 className="font-bold text-gray-700">
              CSV
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Medical datasets and structured
              healthcare information
            </p>
          </div>

        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-blue-300 rounded-2xl p-10 bg-blue-50 flex flex-col items-center justify-center">

          <div className="text-5xl mb-4">
            📤
          </div>

          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Select Medical Document
          </h2>

          <p className="text-gray-500 text-sm mb-5">
            Supported formats: PDF, CSV
          </p>

          <input
            id="rag-file-input"
            type="file"
            accept=".pdf,.csv,application/pdf,text/csv"
            onChange={handleFileChange}
            className="mb-5"
          />

          {file && (
            <div className="w-full max-w-md bg-white rounded-xl p-5 shadow-sm border">

              <div className="flex items-center gap-4">

                <div className="text-4xl">
                  {getFileIcon()}
                </div>

                <div className="flex-1 min-w-0">

                  <p className="font-semibold text-gray-700 truncate">
                    {file.name}
                  </p>

                  <p className="text-sm text-blue-600 mt-1">
                    {getFileType()}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    document.getElementById(
                      "rag-file-input"
                    ).value = "";
                  }}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ✕
                </button>

              </div>

            </div>
          )}

        </div>

        {/* Upload Button */}
        <button
          onClick={uploadFile}
          disabled={loading || !file}
          className={`w-full mt-8 py-4 rounded-xl font-semibold text-lg transition duration-300 ${
            loading || !file
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading
            ? `Uploading & Indexing ${file?.name || "file"}...`
            : file
            ? `Upload ${getFileType()}`
            : "Select a File"}
        </button>

        {/* Response Message */}
        {message && (
          <div
            className={`mt-6 p-4 rounded-xl text-center font-medium ${
              messageType === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Features */}
        <div className="mt-10 bg-gray-50 rounded-xl p-6">

          <h2 className="text-xl font-bold mb-4 text-gray-700">
            🚀 RAG Features
          </h2>

          <ul className="space-y-3 text-gray-600">

            <li>
              ✅ PDF document processing
            </li>

            <li>
              ✅ CSV dataset processing
            </li>

            <li>
              ✅ SHA-256 duplicate detection
            </li>

            <li>
              ✅ Automatic document chunking
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