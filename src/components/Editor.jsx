import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { jsPDF } from "jspdf";
import html2pdf from "html2pdf.js";
import { db } from "../firebase"; // Import Firestore
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"; // Firestore functions
import "./Editor.css";

const Editor = () => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [docId] = useState("shared-document");

  const saveContent = async () => {
    if (quillInstance.current) {
      const content = quillInstance.current.getContents();

      await setDoc(
        doc(db, "documents", docId),
        { content: content.ops },
        { merge: true }
      );
      alert("Content saved!");
    }
  };

  const resetContent = () => {
    if (window.confirm("Are you sure you want to reset all content?")) {
      if (quillInstance.current) {
        quillInstance.current.setContents([]);
        localStorage.removeItem("editorContent");
        setDoc(doc(db, "documents", docId), { content: [] });
        alert("Content reset!");
      }
    }
  };

  const updateWordCount = (text) => {
    const words = text.trim().length > 0 ? text.trim().split(/\s+/) : [];
    setWordCount(words.length);
    setCharCount(text.length);
  };

  const exportToPDF = () => {
    if (quillInstance.current) {
      const editorContent = quillInstance.current.root.innerHTML;

      const options = {
        margin: [10, 10, 10, 10],
        filename: "editor_content.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      html2pdf().set(options).from(editorContent).save();
    }
  };

  useEffect(() => {
    if (!quillInstance.current) {
      const toolbarOptions = [
        ["bold", "italic", "underline"],
        [{ header: [1, 2, 3, false] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ];
  
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Start writing here...",
        modules: {
          toolbar: toolbarOptions,
        },
        formats: ["direction"], // Allow text direction formatting
      });
  
      quillInstance.current.format("direction", "ltr"); // Set to Left-to-Right
  
      // Load content from Firestore
      const loadContent = async () => {
        const docRef = doc(db, "documents", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          quillInstance.current.setContents(docSnap.data().content);
          // Ensure the cursor is at the end after loading content
          setTimeout(() => {
            const length = quillInstance.current.getLength();
            quillInstance.current.setSelection(length, 0); // Move cursor to the end
          }, 0);
        }
      };
      loadContent();
  
      // Listen for Firestore changes in real time
      const unsubscribe = onSnapshot(doc(db, "documents", docId), (snapshot) => {
        if (snapshot.exists() && quillInstance.current) {
          const newContent = snapshot.data().content;
          const quill = quillInstance.current;
  
          // Save cursor position before update
          const selection = quill.getSelection();
          const currentContent = quill.getContents();
  
          // Only update if Firestore content is actually different
          if (JSON.stringify(newContent) !== JSON.stringify(currentContent.ops)) {
            quill.setContents(newContent, 'silent'); // 'silent' prevents triggering another text-change event
  
            // Restore cursor position smoothly
            setTimeout(() => {
              if (selection) {
                quill.setSelection(selection.index, selection.length);
              }
            }, 0);
          }
        }
      });
  
      // Sync changes to Firestore
      quillInstance.current.on("text-change", () => {
        const quill = quillInstance.current;
        const content = quill.getContents();
  
        // Save cursor position
        const selection = quill.getSelection();
  
        setDoc(doc(db, "documents", docId), { content: content.ops }, { merge: true });
  
        // Always move cursor to the end after a change
        setTimeout(() => {
          const length = quill.getLength();
          quill.setSelection(length, 0); // Move cursor to the end
        }, 0);
  
        const editorText = quill.root.innerText;
        updateWordCount(editorText);
      });
  
      return () => unsubscribe(); // Cleanup Firestore listener on unmount
    }
  }, []);
  

  return (
    <div className="editor-container">
      <div ref={editorRef} className="editor-box" />
      <div className="editor-buttons">
        <button onClick={saveContent} className="editor-save-button">
          Save Content
        </button>
        <button onClick={resetContent} className="editor-reset-button">
          Reset Content
        </button>
        <button onClick={exportToPDF} className="editor-export-button">
          Export to PDF
        </button>
      </div>
      <div className="word-count">
        <span>Words: {wordCount}</span> | <span>Characters: {charCount}</span>
      </div>
    </div>
  );
};

export default Editor;
