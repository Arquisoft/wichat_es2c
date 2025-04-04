import React, { useState, useRef, useEffect } from "react";
import styles from "./Nav.module.css";
import { Link, useNavigate } from "react-router-dom";

// Iconos
import { IoGameController } from 'react-icons/io5';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { MdLeaderboard } from 'react-icons/md';
import { CgNotes } from 'react-icons/cg';

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
            <Link to="/home">
                <img src="/wiChatLogos/LogoWichat2_512.png" alt="Logo" className={styles.logo} />
            </Link>

            

            <div className={styles.navGeneralLinks}>
                <Link to={isLoggedIn ? "/game" : "/login"} className={styles.navLink}>
                    <IoGameController style={{ marginRight: '5px' }} /> Play
                </Link>
                <Link to="/leaderboard" className={styles.navLink}>
                    <MdLeaderboard style={{ marginRight: '5px' }} /> Leaderboard
                </Link>
            </div>

            {isLoggedIn && (
                <div className={styles.navSeparator}></div>
            )}
            {isLoggedIn && (
                <div className={styles.navPersonalLinks}>
                    <Link to="/history" className={styles.navLink}>
                        <CgNotes style={{ marginRight: '5px' }} /> History
                    </Link>
                </div>
            )}

            <div className={styles.profileNavSection}>
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
                                <Link
                                    to="/login"
                                    className={`${styles.dropdownItem} ${styles.logoutButton}`}
                                    onClick={(e) => {
                                        e.preventDefault(); // Prevenir la navegación inmediata
                                        handleLogout();     // Ejecutar la lógica de cierre de sesión
                                    }}
                                >
                                    Log out
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                    <div className={styles.authLinks}>
                        <Link to="/login" className={styles.authLink}>
                            <FaSignInAlt style={{ marginRight: '8px' }} /> Log in
                        </Link>
                        <Link to="/signup" className={styles.authLink}>
                            <FaUserPlus style={{ marginRight: '8px' }} /> Register
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}