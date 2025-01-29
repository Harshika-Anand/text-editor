import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
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
            <a href={`/editor/${doc.id}`}>{doc.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
