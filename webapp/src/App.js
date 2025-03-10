// App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import Home from "./Home";
import Login from "./components/Login";
import AddUser from "./components/AddUser";
import History from "./views/History";


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
                <Route path="/history" element={<History />} />
            </Routes>
        </>
    );
}

export default App;