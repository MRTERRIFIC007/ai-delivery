import React, { useState, useEffect } from "react";

// Simplified version without any external dependencies
const FallbackApp: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Attempt to connect to the backend health endpoint
        const response = await fetch("http://localhost:5003/health", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        setApiResponse(JSON.stringify(data, null, 2));
        setStatus("success");
      } catch (error) {
        console.error("API connection failed:", error);
        setErrorDetails(
          error instanceof Error ? error.message : "Unknown error"
        );
        setStatus("error");
      }
    };

    checkBackend();
  }, []);

  const containerStyle: React.CSSProperties = {
    fontFamily: "Arial, sans-serif",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    marginTop: "50px",
  };

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#333",
    borderBottom: "1px solid #ddd",
    paddingBottom: "15px",
    marginBottom: "20px",
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "5px",
    marginBottom: "15px",
    border: "1px solid #ddd",
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "#4a90e2",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1>OptiDeliver System Diagnosis</h1>
        <p>Troubleshooting page for connectivity issues</p>
      </div>

      <div style={sectionStyle}>
        <h2>System Status</h2>
        {status === "loading" && <p>Checking backend connection...</p>}
        {status === "error" && (
          <div>
            <p style={{ color: "#d32f2f" }}>❌ Backend connection failed</p>
            <p>Error details: {errorDetails}</p>
          </div>
        )}
        {status === "success" && (
          <div>
            <p style={{ color: "#4caf50" }}>✅ Backend connection successful</p>
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {apiResponse}
            </pre>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h2>Troubleshooting Steps</h2>
        <ol>
          <li>Check if the backend server is running on port 5003</li>
          <li>Disable any ad blockers or privacy extensions in your browser</li>
          <li>Check the browser console for specific error messages</li>
          <li>Verify that your firewall is not blocking local connections</li>
          <li>Try accessing the application in a different browser</li>
        </ol>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button style={buttonStyle} onClick={() => window.location.reload()}>
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default FallbackApp;
