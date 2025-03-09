import React, { useState, useRef, useEffect } from "react";
import styles from "./Nav.module.css";
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
        <nav className={styles.navContainer}>
            <Link to="/home">
                <img src="/logo.jpg" alt="Logo" className={styles.logo} />
            </Link>

            <div>
                <div className={styles.userDropdown} ref={dropdownRef}>
                    <div className={styles.dropdownTrigger} onClick={toggleDropdown}>
                        <img
                            src="/logo.jpg"
                            alt="User"
                            className={styles.userAvatar}
                        />
                    </div>

                    {dropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.dropdownContent}>
                                <Link
                                    to="/history"
                                    className={styles.dropdownItem}
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    View History
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className={`${styles.dropdownItem} ${styles.logoutButton}`}
                                >
                                    Log out
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/*<div className={styles.authLinks}>*/}
                {/*    <Link to="/login" className={styles.authLink}>*/}
                {/*        Log in*/}
                {/*    </Link>*/}
                {/*    <Link to="/signup" className={styles.authLink}>*/}
                {/*        Register*/}
                {/*    </Link>*/}
                {/*</div>*/}
            </div>
        </nav>
    );
}