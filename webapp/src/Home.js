import React, { useEffect, useState } from "react";
import Nav from "./components/Nav";
import "./Home.css";

function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <Nav />
            <div
                className="container"
                style={{
                    flex: 1,
                    backgroundImage: "url('/bg.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    position: "relative"
                }}
            >
                {!isLoggedIn ? (
                    <button className="play-button">
                        <a href="/login" style={{ color: "white" }}>
                            Log in to play
                        </a>
                    </button>
                ) : (
                    <button className="play-button">
                        <a href="/game" style={{ color: "white" }}>
                            Play the game
                        </a>
                    </button>
                )}
            </div>
        </div>
    );
}

export default Home;
