import React, { useEffect, useRef,useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { jsPDF } from "jspdf";
import html2pdf from "html2pdf.js";
import "./Editor.css"; 

const Editor = () => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const saveContent = () => {
    if (quillInstance.current) {
      const content = quillInstance.current.getContents(); 
      localStorage.setItem("editorContent", JSON.stringify(content));
      alert("Content saved!");
    }
  };

  const resetContent = () => {
    if (quillInstance.current) {
      quillInstance.current.setContents([]); 
      localStorage.removeItem("editorContent"); 
      alert("Content reset!");
    }
  };

  const updateWordCount = (text) => {
    const words = text.trim().split(/\s+/).filter(Boolean); // Split by spaces and filter out empty strings
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
      });

      const savedContent = localStorage.getItem("editorContent");
      if (savedContent) {
        quillInstance.current.setContents(JSON.parse(savedContent));
      }

      quillInstance.current.on("text-change", () => {
        const editorText = quillInstance.current.root.innerText; // Get plain text from the editor
        updateWordCount(editorText);
      });
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
