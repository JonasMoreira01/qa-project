import React from "react";
import ReactDOM from "react-dom/client";
import { TooltipProvider } from "@inmediam/ui";
import App from "./pages/App.jsx";
import "./styles/index.css";

document.getElementById("root")?.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>
);
