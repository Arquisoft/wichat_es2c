import React, { useState, useRef, useEffect } from "react";
import styles from "./Nav.module.css";

export default function Nav() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setDropdownOpen(false);
        window.location.href = '/login';
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
        <nav className={styles.navContainer}>
            <a href="/home">
                <img src="/logo512.png" alt="Logo" className={styles.logo} />
            </a>
            <div>
                {isLoggedIn ? (
                    <div className={styles.userDropdown} ref={dropdownRef}>
                        <div
                            className={styles.dropdownTrigger}
                            onClick={toggleDropdown}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    toggleDropdown();
                                }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-haspopup="true"
                            aria-expanded={dropdownOpen}
                        >
                            <img
                                src="/pfp.png"
                                alt="User"
                                className={styles.userAvatar}
                            />
                        </div>

                        {dropdownOpen && (
                            <div className={styles.dropdownMenu}>
                                <div className={styles.dropdownContent}>
                                    <a
                                        href="/history"
                                        className={styles.dropdownItem}
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        View History
                                    </a>
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
                ) : (
                    <div className={styles.authLinks}>
                        <a href="/login" className={styles.authLink}>
                            Log in
                        </a>
                        <a href="/signup" className={styles.authLink}>
                            Register
                        </a>
                    </div>
                )}
            </div>
        </nav>
    );
}