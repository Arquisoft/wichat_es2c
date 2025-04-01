import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Nav from "./components/Nav";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim"; // Cambiado de loadFull a loadSlim
import "./Home.css";

function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    
    // Inicializar tsparticles con loadSlim en lugar de loadFull
    const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);  // Usar loadSlim para una versión más ligera
    }, []);

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <Nav />
            
            {/* Configuración de partículas */}
            <Particles
                id="tsparticles"
                init={particlesInit}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    zIndex: 0
                }}
                options={{
                    background: {
                        color: {
                            value: "transparent"
                        }
                    },
                    fpsLimit: 60,
                    particles: {
                        color: {
                            value: "#8590AA"
                        },
                        links: {
                            color: "#8590AA",
                            distance: 150,
                            enable: true,
                            opacity: 0.7,     // Aumentado de 0.5 a 0.7
                            width: 2.5        // Aumentado de 1 a 2.5
                        },
                        move: {
                            enable: true,
                            direction: "none",
                            outModes: {
                                default: "bounce"
                            },
                            random: false,
                            speed: 1,
                            straight: false
                        },
                        number: {
                            density: {
                                enable: true,
                                area: 800
                            },
                            value: 80
                        },
                        opacity: {
                            value: 0.8       // Aumentado de 0.5 a 0.8
                        },
                        shape: {
                            type: "circle"
                        },
                        size: {
                            value: { min: 3, max: 6 }  // Aumentado de {min: 1, max: 3} a {min: 3, max: 6}
                        }
                    },
                    detectRetina: true
                }}
            />
            
            <div
                className="container"
                style={{
                    flex: 1,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    position: "relative",
                    zIndex: 1  // Asegurarse de que esté por encima de las partículas
                }}
            >
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