import React, { useState } from "react";
import Container from "@mui/material/Container";
import {  Link } from "react-router-dom";
import Nav from "./components/Nav";
import "./Home.css";


function Home() {
    const [user, setUser] = useState(null);

    return (
        <>
            <Nav />
            <Container
                component="main"
                className="container"
                maxWidth={false}
                sx={{
                    height: "calc(100vh - 64px)",
                    backgroundImage: "url('/logo.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                }}
            >
                <button className="boton-jugar">
                    <Link to="/login" style={{color: "white"}}>Log in to play</Link>
                </button>
                {/*<button className="boton-jugar">*/}
                {/*    <Link to="/game" style={{color: "white"}}>Play the game</Link>*/}
                {/*</button>*/}
            </Container>
        </>
    );
}

export default Home;
