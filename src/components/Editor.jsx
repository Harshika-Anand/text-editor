import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { db } from "../firebase"; // Firestore
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // Authentication
import html2pdf from "html2pdf.js"; // PDF Export
import "./Editor.css";

const Editor = () => {
  const { user } = useAuth();
  const { docId } = useParams(); // Get document ID from URL
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const isViewer = new URLSearchParams(window.location.search).get("access") === "viewer";
  const [docTitle, setDocTitle] = useState("Loading...");

  useEffect(() => {
    if (!quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Start writing here...",
        modules: { toolbar: [["bold", "italic", "underline"], [{ list: "ordered" }, { list: "bullet" }], ["link", "image"]] }
      });

      const checkOwnership = async () => {
        const docRef = doc(db, "documents", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          setIsOwner(docData.userId === user.uid);
          setDocTitle(docData.title || "Untitled Document");
          quillInstance.current.setContents(docData.content || []);
        } else {
          // If the document doesn't exist, create it for the user
          await setDoc(docRef, { userId: user.uid, content: [] });
          setIsOwner(true);
        }
      };

      checkOwnership();

      // Real-time updates
      const unsubscribe = onSnapshot(doc(db, "documents", docId), (snapshot) => {
        if (snapshot.exists() && quillInstance.current) {
          quillInstance.current.setContents(snapshot.data().content || []);
          setDocTitle(snapshot.data.title || "Untitled Document");
        }
      });

      // Track text changes for saving & word count
      quillInstance.current.on("text-change", async () => {
        if (isOwner) {
          setIsSaving(true);
          const content = quillInstance.current.getContents();
          await setDoc(doc(db, "documents", docId), { userId: user.uid, content }, { merge: true });

          setTimeout(() => setIsSaving(false), 1000);
        }

        // Update word & character count
        updateWordCount(quillInstance.current.getText());
      });

      return () => unsubscribe();
    }
  }, [docId, user.uid, navigate]);

  // Update Word & Character Count
  const updateWordCount = (text) => {
    const words = text.trim().length > 0 ? text.trim().split(/\s+/) : [];
    setWordCount(words.length);
    setCharCount(text.length);
  };

  // Save Content Manually
  const saveContent = async () => {
    if (quillInstance.current && isOwner) {
      const content = quillInstance.current.getContents();
      await setDoc(doc(db, "documents", docId), { content: content.ops }, { merge: true });
      alert("Content saved!");
    }
  };

  // Reset Document Content
  const resetContent = async () => {
    if (window.confirm("Are you sure you want to reset this document?")) {
      if (quillInstance.current) {
        quillInstance.current.setContents([]);
        await setDoc(doc(db, "documents", docId), { content: [] }, { merge: true });
        alert("Document reset!");
      }
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (quillInstance.current) {
      const editorContent = quillInstance.current.root.innerHTML;
      const options = {
        margin: 10,
        filename: "document.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      html2pdf().set(options).from(editorContent).save();
    }
  };

  // Share Document Link
  const handleShare = () => {
    const shareableLink = `${window.location.origin}/editor/${docId}?access=viewer`;
    navigator.clipboard.writeText(shareableLink);
    alert("Shareable link copied to clipboard!");
  };

  return (
    <div className="editor-container">
      <h2>Editing Document: {docTitle}</h2>

      {isSaving && <span className="saving-indicator">Saving...</span>}
      <div ref={editorRef} className="editor-box" />

      {/* Action Buttons */}
      <div className="editor-buttons">
        <button onClick={saveContent} className="editor-save-button">Save</button>
        <button onClick={resetContent} className="editor-reset-button">Reset</button>
        <button onClick={exportToPDF} className="editor-export-button">Export to PDF</button>
        {!isViewer && (
          <button onClick={handleShare} className="share-button">Share</button>
        )}
      </div>
     
      {/* Word Count */}
      <div className="word-count">
        <span>Words: {wordCount}</span> | <span>Characters: {charCount}</span>
      </div>
    </div>
  );
};

export default Editor;
