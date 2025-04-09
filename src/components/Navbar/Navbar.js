import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Navbar() {
  const { loggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSticky, setIsSticky] = useState(false);

  // Sticky navbar ayarları
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Çıkış yapma işlemi
  const handleLogout = () => {
    logout(() => {
      navigate("/"); // Ana sayfaya yönlendirme
    });
  };

  // Belirli bir bölüme kaydırma
  const scrollToSection = (sectionId, targetPath) => {
    if (location.pathname !== targetPath) {
      // Farklı bir sayfadaysa yönlendirme yap
      navigate(targetPath, { state: { targetSection: sectionId } });
    } else {
      // Aynı sayfadaysa kaydırma işlemi yap
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        console.warn(`Section with ID '${sectionId}' not found.`);
      }
    }
  };

  const handleScrollToLogin = () => scrollToSection("call-to-action", "/");
  const handleScrollToProfile = () =>
    scrollToSection("my-profiles", "/profile");
  const handleScrollToStatistic = () =>
    scrollToSection("exercise-stats", "/profile");

  return (
    <header className={`header-area ${isSticky ? "header-sticky" : ""}`}>
      <div className="container">
        <div className="row">
          <div className="col-12">
            <nav className="main-nav">
              <a href="/" className="logo">
                FITNESS<em>AI</em>
              </a>
              <ul className="nav main-button">
                {!loggedIn ? (
                  <li>
                    <button
                      className="btn btn-outline-primary"
                      onClick={handleScrollToLogin}
                    >
                      Login
                    </button>
                  </li>
                ) : (
                  <li>
                    <div className="dropdown">
                      <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Hesabım
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <a className="dropdown-item" onClick={handleScrollToProfile} > My Profile </a>
                        </li>
                        <li>
                          <a className="dropdown-item" onClick={handleScrollToStatistic} > My Statistics </a>
                        </li>
                        <li>
                          <a className="dropdown-item" onClick={handleLogout}> Logout </a>
                        </li>
                      </ul>
                    </div>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
