import React from "react";
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import App from './App';
import StripeCheckoutPage from './StripeCheckoutPage';
import StripeCompletionPage from './StripeCompletionPage'
import BTCCheckoutPage from './BTCCheckoutPage';

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/btcpay-checkout" element={<BTCCheckoutPage />} />
      <Route path="/stripe-checkout" element={<StripeCheckoutPage />} />
      <Route path="/stripe-completion" element={<StripeCompletionPage />} />
    </Routes>
  </BrowserRouter>
);