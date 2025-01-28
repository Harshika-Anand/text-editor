import React from "react";
import Editor from "./Editor";
import "./App.css"

const App = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Collaborative Text Editor</h1>
      <Editor />
    </div>
  );
};

export default App;
