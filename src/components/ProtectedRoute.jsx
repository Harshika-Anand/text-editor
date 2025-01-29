// components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Assuming you are using AuthContext

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth(); // Assuming user is part of AuthContext

  if (!user) {
    // Redirect to login if no user is authenticated
    return <Navigate to="/login" />;
  }

  return children; // If user exists, render the child components
};

export default ProtectedRoute; // Ensure this line is here
