import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // ⭐ DÒNG QUYẾT ĐỊNH: kích hoạt Tailwind & giao diện LMS

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
