import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-light border-top pt-5 pb-5">
      <div className="container">
        <div className="row text-center text-md-start">
          {/* Polityka prywatności */}
          <div className="col-md-3 mb-3">
            <h6 className="fw-bold">Polityka prywatności</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="" className="text-muted">
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <Link to="" className="text-muted">
                  Polityka cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Pomoc */}
          <div className="col-md-3 mb-3">
            <h6 className="fw-bold">Pomoc</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="" className="text-muted">
                  Pomoc i kontakt
                </Link>
              </li>
              <li>
                <Link to="" className="text-muted">
                  FAQ — często zadawane pytania
                </Link>
              </li>
              <li>
                <Link to="" className="text-muted">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Informacje prawne */}
          <div className="col-md-3 mb-3">
            <h6 className="fw-bold">Informacje prawne</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="" className="text-muted">
                  Regulamin sklepu
                </Link>
              </li>
              <li>
                <Link to="" className="text-muted">
                  Zwroty
                </Link>
              </li>
              <li>
                <Link to="" className="text-muted">
                  Reklamacja
                </Link>
              </li>
            </ul>
          </div>

          {/* Logo i social media */}
          <div className="col-md-3 mb-3 text-md-end text-center">
            <div className="mb-2">
              <img
                src="/header-logo.png"
                alt="Kapturowo logo"
                style={{ height: "80px" }}
              />
            </div>
            <div>
              <a href="#">
                <svg
                  x="0px"
                  y="0px"
                  style={{ width: "3em", height: "3em" }}
                  viewBox="0 0 24 24"
                >
                  <path d="M 8 3 C 5.239 3 3 5.239 3 8 L 3 16 C 3 18.761 5.239 21 8 21 L 16 21 C 18.761 21 21 18.761 21 16 L 21 8 C 21 5.239 18.761 3 16 3 L 8 3 z M 18 5 C 18.552 5 19 5.448 19 6 C 19 6.552 18.552 7 18 7 C 17.448 7 17 6.552 17 6 C 17 5.448 17.448 5 18 5 z M 12 7 C 14.761 7 17 9.239 17 12 C 17 14.761 14.761 17 12 17 C 9.239 17 7 14.761 7 12 C 7 9.239 9.239 7 12 7 z M 12 9 A 3 3 0 0 0 9 12 A 3 3 0 0 0 12 15 A 3 3 0 0 0 15 12 A 3 3 0 0 0 12 9 z"></path>
                </svg>
              </a>
              <a href="#">
                <svg
                  x="0px"
                  y="0px"
                  style={{ width: "3em", height: "3em" }}
                  viewBox="0 0 24 24"
                >
                  <path d="M12,2C6.477,2,2,6.477,2,12c0,5.013,3.693,9.153,8.505,9.876V14.65H8.031v-2.629h2.474v-1.749 c0-2.896,1.411-4.167,3.818-4.167c1.153,0,1.762,0.085,2.051,0.124v2.294h-1.642c-1.022,0-1.379,0.969-1.379,2.061v1.437h2.995 l-0.406,2.629h-2.588v7.247C18.235,21.236,22,17.062,22,12C22,6.477,17.523,2,12,2z"></path>
                </svg>
              </a>
              <a href="#">
                <svg
                  x="0px"
                  y="0px"
                  style={{ width: "3em", height: "3em" }}
                  viewBox="0 0 24 24"
                >
                  <path d="M10.053,7.988l5.631,8.024h-1.497L8.566,7.988H10.053z M21,6v12	c0,1.657-1.343,3-3,3H6c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h12C19.657,3,21,4.343,21,6z M17.538,17l-4.186-5.99L16.774,7	h-1.311l-2.704,3.16L10.552,7H6.702l3.941,5.633L6.906,17h1.333l3.001-3.516L13.698,17H17.538z"></path>
                </svg>
              </a>
              <a href="#">
                <svg
                  x="0px"
                  y="0px"
                  style={{ width: "3em", height: "3em" }}
                  viewBox="0 0 24 24"
                >
                  <path d="M 6 3 C 4.3550302 3 3 4.3550302 3 6 L 3 18 C 3 19.64497 4.3550302 21 6 21 L 18 21 C 19.64497 21 21 19.64497 21 18 L 21 6 C 21 4.3550302 19.64497 3 18 3 L 6 3 z M 12 7 L 14 7 C 14 8.005 15.471 9 16 9 L 16 11 C 15.395 11 14.668 10.734156 14 10.285156 L 14 14 C 14 15.654 12.654 17 11 17 C 9.346 17 8 15.654 8 14 C 8 12.346 9.346 11 11 11 L 11 13 C 10.448 13 10 13.449 10 14 C 10 14.551 10.448 15 11 15 C 11.552 15 12 14.551 12 14 L 12 7 z"></path>
                </svg>
              </a>
              <a href="#">
                <svg
                  x="0px"
                  y="0px"
                  style={{ width: "3em", height: "3em" }}
                  viewBox="0 0 24 24"
                >
                  <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
