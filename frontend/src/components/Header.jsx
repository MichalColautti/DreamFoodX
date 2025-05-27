import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?name=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="bg-light border-bottom sticky-top w-100">
      <div className="container d-flex justify-content-between align-items-center p-2">
        <div className="d-flex align-items-center">
          <Link to="/">
            <img
              src="/header-logo.png"
              alt="Kapturowo Logo"
              height="55"
              className="d-inline-block align-top me-2"
              style={{ cursor: "pointer" }}
            />
          </Link>
        </div>

        {/* Search by recipe name */}
        <div className="flex-grow-1">
          <form
            className="d-flex align-items-center bg-light"
            role="search"
            onSubmit={handleSubmit}
          >
            <div className="search-wrapper w-100 bg-light position-relative">
              <input
                type="text"
                placeholder="Szukaj przepisu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control border-0 border-bottom ps-5 bg-light"
                style={{ borderRadius: 0, boxShadow: "none" }}
              />
              <button
                type="submit"
                className="position-absolute top-50 start-0 translate-middle-y ps-3 pe-2 btn btn-link"
              >
                <svg
                  className="search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    width: "16px",
                    height: "16px",
                    color: "#555",
                    minWidth: "16px",
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </form>
        </div>

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

        <div className="d-flex align-items-center">
          <ProfileMenu />
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
