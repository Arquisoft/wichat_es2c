// App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import Home from "./Home";
import Login from "./components/Login";
import AddUser from "./components/AddUser";
import History from "./views/History";
import Leaderboard from "./views/Leaderboard";
import Game from "./components/Game"
import ProtectedRoute from "./ProtectedRoute";


function App() {
    return (
        <>
            <CssBaseline />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<AddUser />} />
                <Route path="/register" element={<AddUser />} />
                <Route path="/Leaderboard" element={<Leaderboard />} />
                <Route path="/history" element={
                    <ProtectedRoute>
                        <History />
                    </ProtectedRoute>
                } />
                <Route path="/game" element={
                    <ProtectedRoute>
                        <Game />
                    </ProtectedRoute>
                } />
            </Routes>
        </>
    );
}

export default App;