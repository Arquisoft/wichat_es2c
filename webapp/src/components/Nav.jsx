import React, { useState, useRef, useEffect } from "react";
import "./nav.css";
import { Link } from "react-router-dom";

export default function Nav() {
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        setUser(null);
        setDropdownOpen(false);
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Close dropdown when clicking outside
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
                <img src="/logo.jpg" alt="Logo" style={{ height: "60px" }} />
            </Link>

            <div>

                    <div className="user-dropdown" ref={dropdownRef}>
                        <div className="dropdown-trigger" onClick={toggleDropdown}>
                            <img
                                src="/logo.jpg"
                                alt="User"
                                style={{
                                    height: "47px",
                                    width: "47px",
                                    borderRadius: "50%",
                                    cursor: "pointer"
                                }}
                            />
                        </div>

                        {dropdownOpen && (
                            <div className="dropdown-menu">

                                <div className="dropdown-content">
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

                    {/*<div className="auth-links">*/}
                    {/*    <Link to="/login" className="auth-link">*/}
                    {/*        Log in*/}
                    {/*    </Link>*/}
                    {/*    <Link to="/signup" className="auth-link">*/}
                    {/*        Register*/}
                    {/*    </Link>*/}
                    {/*</div>*/}

            </div>
        </nav>
    );
}