import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App";
import { OrderStatus } from "./OrderStatus";
import { Guides } from "./Guides";
import { Blog } from "./Blog";
import { Contact } from "./Contact";
import { FullPage404 } from "./Page404";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/order-status" element={<OrderStatus />} />
            <Route path="/404" element={<FullPage404 />} />
            <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
    </BrowserRouter>
);
