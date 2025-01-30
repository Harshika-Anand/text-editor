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
  const [isOwner, setIsOwner] = useState(false);

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
          if (docData.userId === user.uid) {
            setIsOwner(true);
            quillInstance.current.setContents(docData.content || []);
          } else {
            alert("You don't have access to this document!");
            navigate("/dashboard"); // Redirect unauthorized users
          }
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
        }
      });

      quillInstance.current.on("text-change", () => {
        if (isOwner) {
          setDoc(doc(db, "documents", docId), { userId: user.uid, content: quillInstance.current.getContents() }, { merge: true });
        }
        updateWordCount(quillInstance.current.getText());
      });

      return () => unsubscribe();
    }
  }, [docId, user.uid, navigate, isOwner]);

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

  // Word & Character Count
  const updateWordCount = (text) => {
    const words = text.trim().length > 0 ? text.trim().split(/\s+/) : [];
    setWordCount(words.length);
    setCharCount(text.length);
  };

  return (
    <div className="editor-container">
      <h2>Editing Document: {docId}</h2>
      <div ref={editorRef} className="editor-box" />

      {/* Action Buttons */}
      <div className="editor-buttons">
        <button onClick={saveContent} className="editor-save-button">Save</button>
        <button onClick={resetContent} className="editor-reset-button">Reset</button>
        <button onClick={exportToPDF} className="editor-export-button">Export to PDF</button>
      </div>

      {/* Word Count */}
      <div className="word-count">
        <span>Words: {wordCount}</span> | <span>Characters: {charCount}</span>
      </div>
    </div>
  );
};

export default Editor;
