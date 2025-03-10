import React, {useEffect, useState} from "react";
import { Link } from "react-router-dom";
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
                {!isLoggedIn?( <button className="play-button">
                    <Link to="/login" style={{color: "white"}}>
                        Log in to play
                    </Link>
                </button> )
             : (
                <button className="play-button">
                    <Link to="/game" style={{color: "white"}}>
                        Play the game
                    </Link>
                </button>
                    )
            }
            </div>
        </div>
    );
}

export default Home;