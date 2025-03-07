// App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import Home from "./Home";
import LoginSignup from "./LoginSignup";
import History from "./views/History";


function App() {
    return (
        <>
            <CssBaseline />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<LoginSignup />} />
                <Route path="/signup" element={<LoginSignup />} />
                <Route path="/history" element={<History />} />
            </Routes>
        </>
    );
}

export default App;