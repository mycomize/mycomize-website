import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import { OrderStatus } from "./OrderStatus";
import { Home } from "./Home";
import { Guides } from "./Guides";
import { Blog } from "./Blog";
import { Contact } from "./Contact";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/order-status" element={<OrderStatus />} />
        </Routes>
    </BrowserRouter>
);
