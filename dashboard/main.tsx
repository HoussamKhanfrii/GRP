import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { EngineProvider } from "./EngineContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <EngineProvider>
      <App />
    </EngineProvider>
  </React.StrictMode>
);
