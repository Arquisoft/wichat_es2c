import React, { useState, useRef, useEffect } from "react";
import "./nav.css";
import { Link, useNavigate } from "react-router-dom";

export default function Nav() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setDropdownOpen(false);
        navigate('/login');
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };



    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <nav style={{ alignItems: "center", justifyContent: "space-between" }}>
            <Link to="/home">
                <img src="/logo512.png" alt="Logo" style={{ height: "60px" }} />
            </Link>
            <div>
                {isLoggedIn ? (
                    <div className="user-dropdown" ref={dropdownRef}>
                        <div className="dropdown-trigger" onClick={toggleDropdown}>
                            <img
                                src="/pfp.png"
                                alt="User"
                                style={{
                                    height: "47px",
                                    width: "47px",
                                    borderRadius: "60%",
                                    cursor: "pointer"
                                }}
                            />
                        </div>

                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-content">
                                    <div className="dropdown-user-info">
                                        <p>Hello, {localStorage.getItem('username') || 'User'}</p>
                                    </div>
                                    <Link
                                        to="/history"
                                        className="dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        View History
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="dropdown-item logout-button"
                                    >
                                        Log out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="auth-links">
                        <Link to="/login" className="auth-link">
                            Log in
                        </Link>
                        <Link to="/signup" className="auth-link">
                            Register
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}