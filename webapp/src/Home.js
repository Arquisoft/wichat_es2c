import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Nav from "./components/Nav";
import { Button, Typography, Box } from '@mui/material';
import { motion, AnimatePresence } from "framer-motion";

import "./Home.css";

function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [index, setIndex] = useState(0);

    //imagenes de fondo
    const imagesList = [
        "/backgroundImages/cyber.jpg",
        "/backgroundImages/ponte.jpg",
        "/backgroundImages/montania.jpg"
    ];

    //cambio de imágenes, cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % imagesList.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [imagesList.length]);

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
            <Nav />

            {/* Fondo Animado con framer-motion */}
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
                zIndex: 1,  // Asegura que el contenido esté por encima del fondo
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)", // Fondo oscuro para mejorar la legibilidad
            }}>
                
                    {!isLoggedIn ? (
                        <button className="play-button">
                            <Link to="/login" style={{ color: "white" }}>
                                Log in to play
                            </Link>
                        </button>
                    ) : (
                        <button className="play-button">
                            <Link to="/game" style={{ color: "white" }}>
                                Play the game
                            </Link>
                        </button>
                    )}

                
                {/*Box principal del home, que tenga la presentacion y ver que mas*/}
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <img src="/wiChatLogos/LogoWichat2_512.png" alt="Logo" className="logoAplicacion"  />
                    <Typography variant="h4" sx={{ color: "white", fontWeight: "bold" }}>
                        Welcome to WiChat
                    </Typography>
                    <Typography variant="body1" sx={{ color: "white", mt: 1 }}>
                        A fun way to connect with your friends and play games together.
                    </Typography>
                </Box>
                
            </div>
        </div>
    );
}

export default Home;
