import { useRef, useState } from "react";
import { uploadDocument, deleteDocument } from "../api/client.js";

export default function DocumentPanel({ documents, setDocuments, activeSourceId, setActiveSourceId }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const document = await uploadDocument(file);
      setDocuments((prev) => [...prev, document]);
      setActiveSourceId(document.sourceId);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemove(sourceId) {
    try {
      await deleteDocument(sourceId);
      setDocuments((prev) => prev.filter((doc) => doc.sourceId !== sourceId));
      if (activeSourceId === sourceId) {
        setActiveSourceId(null);
      }
    } catch (error) {
      setUploadError(error.message);
    }
  }

  return (
    <div className="document-panel">
      <h2>Documents</h2>

      <label className="upload-button">
        {isUploading ? "Processing..." : "Upload PDF"}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          hidden
        />
      </label>

      {uploadError && <p className="error-text">{uploadError}</p>}

      <div className="document-list">
        <button
          type="button"
          className={activeSourceId === null ? "document-item active" : "document-item"}
          onClick={() => setActiveSourceId(null)}
        >
          All documents
        </button>

        {documents.map((doc) => (
          <div
            key={doc.sourceId}
            className={activeSourceId === doc.sourceId ? "document-item active" : "document-item"}
          >
            <button type="button" className="document-name" onClick={() => setActiveSourceId(doc.sourceId)}>
              {doc.fileName}
              <span className="document-meta">
                {doc.pageCount} pages, {doc.chunkCount} chunks
              </span>
            </button>
            <button
              type="button"
              className="remove-button"
              onClick={() => handleRemove(doc.sourceId)}
              aria-label={`Remove ${doc.fileName}`}
            >
              Remove
            </button>
          </div>
        ))}

        {documents.length === 0 && <p className="empty-text">No documents uploaded yet.</p>}
      </div>
    </div>
  );
}
