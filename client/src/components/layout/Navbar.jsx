import { useState } from "react";
import {
  Compass,
  LogIn,
  LogOut,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// /profile has no route (see App.jsx) and stays out of the nav.
const navigationItems = [
  { label: "Home", path: "/" },
  { label: "My Trips", path: "/trips" },
  { label: "Map", path: "/map" },
];

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const displayName = user?.name || "Traveler";
  const initial = displayName
    .charAt(0)
    .toUpperCase();

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header className="site-header">
      <nav className="navbar shell">
        <Link
          to="/"
          className="brand"
          onClick={closeMenus}
        >
          <span className="brand-mark">
            <Compass size={22} strokeWidth={2.3} />
          </span>

          <span className="brand-name">Pathly</span>
        </Link>

        <div className="desktop-navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link
                to="/trips/new"
                className="button button-primary navbar-create-button"
              >
                <Plus size={17} />
                New trip
              </Link>

              <div className="user-menu-wrapper">
                <button
                  type="button"
                  className="avatar-button"
                  aria-label="Open user menu"
                  onClick={() =>
                    setUserMenuOpen(
                      (currentValue) => !currentValue
                    )
                  }
                >
                  {initial}
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <strong>{displayName}</strong>
                      <span>
                        {user?.email ||
                          "Pathly traveler"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="dropdown-link dropdown-button"
                      onClick={() => {
                        logout();
                        closeMenus();
                      }}
                    >
                      <LogOut size={17} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="button button-secondary navbar-login-button"
            >
              <LogIn size={17} />
              Log in
            </Link>
          )}

          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Toggle navigation"
            onClick={() =>
              setMobileMenuOpen(
                (currentValue) => !currentValue
              )
            }
          >
            {mobileMenuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-navigation shell">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "mobile-nav-link mobile-nav-link-active"
                  : "mobile-nav-link"
              }
              onClick={closeMenus}
            >
              {item.label}
            </NavLink>
          ))}

          {isAuthenticated && (
            <Link
              to="/trips/new"
              className="button button-primary mobile-create-button"
              onClick={closeMenus}
            >
              <Plus size={17} />
              Create new trip
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
