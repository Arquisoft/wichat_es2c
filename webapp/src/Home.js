
///////////////////////////////////////////////////////
import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Nav from "./components/Nav";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import BackgroundSlider from "react-background-slider"; // Importamos el nuevo slider

import "./Home.css";

function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    // Lista de imágenes de fondo
    const imagesList = [
        "https://images.dog.ceo/breeds/labrador/n02099712_3503.jpg",
        "https://images.dog.ceo/breeds/labrador/n02099712_5844.jpg",
        "https://images.dog.ceo/breeds/labrador/n02099712_5343.jpg",
        "https://images.dog.ceo/breeds/labrador/n02099712_7481.jpg",
        "https://images.dog.ceo/breeds/labrador/n02099712_7414.jpg"
    ];

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
            <Nav />

            {/* Fondo Animado */}
            <BackgroundSlider
                images={imagesList}
                duration={2}  // Duración de cada imagen en segundos
                transition={1} // Tiempo de transición entre imágenes en segundos
            />

            <div className="container" style={{
                flex: 1,
                position: "relative",
                zIndex: 1,  // Asegura que el contenido esté por encima del fondo
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
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
            </div>
        </div>
    );
}

export default Home;
