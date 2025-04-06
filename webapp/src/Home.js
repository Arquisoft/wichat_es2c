import React, { useState, useEffect } from "react";
import Nav from "./components/Nav";
import { Typography, Box } from '@mui/material';
import { motion, AnimatePresence } from "framer-motion";

import "./Home.css";

function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [index, setIndex] = useState(0);

    const imagesList = [
        "/backgroundImages/cyber.jpg",
        "/backgroundImages/ponte.jpg",
        "/backgroundImages/montania.jpg"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % imagesList.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [imagesList.length]);

    const handleRedirect = () => {
        window.location.href = isLoggedIn ? "/game" : "/login";
    };

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
            <Nav />

            {/* Fondo animado */}
            <div className="background-container" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                <AnimatePresence>
                    <motion.div
                        key={index}
                        className="background-slide"
                        style={{
                            backgroundImage: `url(${imagesList[index]})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: -5,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    />
                </AnimatePresence>
            </div>

            <div className="container" style={{
                flex: 1,
                position: "relative",
                zIndex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}>

                <Box className="boxMainPresentation" sx={{ textAlign: "center", mt: 2 }}>
                    <img src="/wiChatLogos/LogoWichat2_512.png" alt="Logo" className="logoAplicacionHome" />
                    <Typography variant="h4" sx={{ color: "white", fontWeight: "bold" }}>
                        Welcome to <span style={{ color: "#9dd7d3" }}>Wi</span><span style={{ color: "#4dc3ba" }}>Chat</span>
                    </Typography>

                    <div className="separator"></div>

                    <Typography variant="body1" sx={{ color: "white", mt: 1 }}>
                        Test your top-level skills with the most top-level technology.
                    </Typography>

                    <button className="play-button" onClick={handleRedirect}>
                        {isLoggedIn ? "Play the game" : "Log in to play"}
                    </button>
                </Box>
            </div>
        </div>
    );
}

export default Home;
