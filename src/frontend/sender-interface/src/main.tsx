import { StrictMode, Suspense, lazy, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Regular imports
import App from "./App.tsx";
import FallbackApp from "./FallbackApp.tsx";
import { AuthProvider } from "./contexts/AuthContext";

// Create a simple error display for debugging
const ErrorDisplay = ({
  error,
  onSwitch,
}: {
  error: Error;
  onSwitch: () => void;
}) => {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#ffebee",
        color: "#c62828",
        border: "1px solid #ef9a9a",
        borderRadius: "4px",
        margin: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>React Error:</h2>
      <p>
        <strong>Message:</strong> {error.message}
      </p>
      <p>
        <strong>Stack:</strong>
      </p>
      <pre
        style={{
          backgroundColor: "#f5f5f5",
          padding: "10px",
          overflowX: "auto",
          fontSize: "12px",
        }}
      >
        {error.stack}
      </pre>
      <button
        onClick={onSwitch}
        style={{
          backgroundColor: "#4a90e2",
          color: "white",
          border: "none",
          padding: "10px 15px",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          marginTop: "15px",
        }}
      >
        Switch to Fallback App
      </button>
    </div>
  );
};

console.log("Sender Interface: Starting application...");

const AppLoader = () => {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <FallbackApp />;
  }

  try {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading App:", error);
    return (
      <ErrorDisplay
        error={error as Error}
        onSwitch={() => setUseFallback(true)}
      />
    );
  }
};

try {
  const rootElement = document.getElementById("root");
  console.log("Root element found:", rootElement);

  if (rootElement) {
    console.log("Creating React root...");
    const root = createRoot(rootElement);
    console.log("Rendering application...");

    try {
      root.render(
        <StrictMode>
          <AppLoader />
        </StrictMode>
      );
      console.log("Application rendered successfully");
    } catch (renderError) {
      console.error("Error during rendering:", renderError);
      const error = renderError as Error;
      const root = createRoot(rootElement);
      root.render(<FallbackApp />);
    }
  } else {
    console.error("Root element not found in the DOM");
    document.body.innerHTML =
      '<div style="padding: 20px; color: red;">Root element not found!</div>';
  }
} catch (error) {
  console.error("Error during application initialization:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">Initialization error: ${
    (error as Error).message
  }</div>`;
}
