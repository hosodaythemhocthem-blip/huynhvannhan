import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

/**
 * 🚀 ENTRY POINT DUY NHẤT CỦA LMS
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ Không tìm thấy phần tử #root trong index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
