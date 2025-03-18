import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("Route Optimization Dashboard: main.tsx is executing");
const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log("Route Optimization Dashboard: App rendered");
} else {
  console.error("Root element not found in the DOM");
}
