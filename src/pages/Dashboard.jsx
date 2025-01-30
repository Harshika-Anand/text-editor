import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import "./Dashboard.css"; // Import CSS for Dashboard

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const docRef = collection(db, "documents");
      const docSnapshot = await getDocs(docRef);
      const docList = docSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDocuments(docList.filter(doc => doc.userId === user.uid)); // Filter by user
    };
    fetchDocuments();
  }, [user.uid]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleCreateDocument = async () => {
    const docRef = await addDoc(collection(db, "documents"), {
      userId: user.uid,
      title: "Untitled Document",
      content: "",
      createdAt: new Date(),
    });
    navigate(`/editor/${docRef.id}`);
  };

  const handleEditTitle = async (docId, newTitle) => {
    await updateDoc(doc(db, "documents", docId), { title: newTitle });
    setDocuments(prevDocs =>
      prevDocs.map(doc => (doc.id === docId ? { ...doc, title: newTitle } : doc))
    );
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      await deleteDoc(doc(db, "documents", docId));
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.username}!</h2>
      <div className="dashboard-buttons">
        <button onClick={handleCreateDocument} className="btn create-btn">Create New Document</button>
        <button onClick={handleLogout} className="btn logout-btn">Logout</button>
      </div>
      <h3>Your Documents:</h3>
      <ul className="document-list">
        {documents.map(doc => (
          <li key={doc.id} className="document-item">
            <input
              type="text"
              value={doc.title}
              onChange={(e) => handleEditTitle(doc.id, e.target.value)}
              className="document-title-input"
            />
           
            <button onClick={() => navigate(`/editor/${doc.id}`)} className="btn edit-btn">Edit</button>
            <button onClick={() => handleDeleteDocument(doc.id)} className="btn delete-btn">Delete</button>
            <span className="document-date">
              {new Date(doc.createdAt?.seconds * 1000).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
