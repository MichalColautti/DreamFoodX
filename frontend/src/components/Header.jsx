import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
function Header() {
  return (
    <header className="bg-light border-bottom sticky-top">
      <div className="container d-flex justify-content-between align-items-center p-2">
        <div className="d-flex align-items-center">
          <Link to="/">
            <img
              src="\header-logo.png"
              alt="Kapturowo Logo"
              height="55"
              className="d-inline-block align-top me-2"
              style={{ cursor: "pointer" }}
            />
          </Link>
        </div>
        {/*Kod do wyszukiwarki */}
        <form
          className="d-flex align-items-center bg-light"
          role="search"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="search-wrapper w-100 bg-light position-relative">
            <input
              type="text"
              placeholder="Szukaj..."
              className="form-control border-0 border-bottom ps-5 bg-light"
              style={{ borderRadius: 0, boxShadow: "none" }}
            />
            <button type="submit">
              <svg
                className="search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: "16px", height: "16px", color: "#555" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </form>
        <nav className="ms-auto d-none d-lg-block">
          <ul className="nav">
            <li className="nav-item me-3">
              <Link to="/my-recipes" className="nav-link">
                Moje przepisy
              </Link>
            </li>
            <li className="nav-item me-3">
              <Link to="/new-recipe" className="nav-link">
                Dodaj nowy przepis
              </Link>
            </li>
          </ul>
        </nav>
        {/* Kod do icon */}
        <div className="d-flex align-items-center">
          <Link to="/user-profile" className="btn btn-link p-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "1.2em", height: "1.2em" }}
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
          <Link to="/favorites" className="btn btn-link p-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "1.2em", height: "1.2em" }}
            >
              <path d="M12 21 L3.5 12.5 A5.5 5.5 0 0 1 11.28 4.72 L12 6.2 L12.72 4.72 A5.5 5.5 0 0 1 20.5 12.5 L12 21 Z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
