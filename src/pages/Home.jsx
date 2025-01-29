// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // Import Home-specific CSS

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to the App!</h1>
      <p>Get started by signing up or logging in.</p>
      <div>
        <Link to="/signup">Sign Up</Link> | <Link to="/login">Log In</Link>
      </div>
    </div>
  );
};

export default Home;
