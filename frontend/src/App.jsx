import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import My_recipes from "./pages/My_recipes";
import User_profile from "./pages/User_profile";
import Favorites from "./pages/Favorites";
import New_recipe from "./pages/New_recipe";
import Header from "./components/Header"; // Możliwe że tu bedzie wyświetlał się błąd, ale to normalne
import Footer from "./components/Footer";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";
import { AuthProvider } from "./AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/my-recipes" element={<My_recipes />} />
          <Route path="/new-recipe" element={<New_recipe />} />
          <Route path="/user-profile" element={<User_profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </Router>
  );
}

export default App;
