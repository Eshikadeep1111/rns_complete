"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  status: string;
  timestamp: string;
}

const endpoints = [
  {
    method: "GET",
    path: "/api/health",
    description: "Health check endpoint",
  },
  {
    method: "POST",
    path: "/api/session/check-in",
    description: "Employee check-in — creates a new active session",
  },
  {
    method: "POST",
    path: "/api/session/check-out",
    description: "Employee check-out — closes the active session",
  },
  {
    method: "GET",
    path: "/api/session/status",
    description: "Check if an employee has an active session (?emp_id=EMP001)",
  },
  {
    method: "POST",
    path: "/api/location",
    description: "Submit a GPS location ping (requires active session)",
  },
  {
    method: "GET",
    path: "/api/locations",
    description: "Fetch location pings with filters (synced, emp_id, limit, offset)",
  },
  {
    method: "GET",
    path: "/api/sessions",
    description: "Fetch sessions with filters (emp_id, is_active, limit, offset)",
  },
  {
    method: "PATCH",
    path: "/api/locations/mark-synced",
    description: "Mark location pings as synced by IDs",
  },
];

const methodColors: Record<string, string> = {
  GET: "#22c55e",
  POST: "#3b82f6",
  PATCH: "#f59e0b",
};

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setError("API unreachable"));
  }, []);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "60px auto",
        padding: "0 24px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
        color: "#e4e4e7",
        backgroundColor: "#09090b",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Employee Tracker API
      </h1>
      <p style={{ color: "#a1a1aa", marginBottom: 32 }}>
        GPS location tracking backend with session management &mdash; API only, no frontend UI.
      </p>

      <div
        style={{
          padding: "16px 20px",
          borderRadius: 8,
          border: "1px solid #27272a",
          marginBottom: 32,
          backgroundColor: "#18181b",
        }}
      >
        <h2
          style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#a1a1aa" }}
        >
          API Status
        </h2>
        {error ? (
          <span style={{ color: "#ef4444" }}>{error}</span>
        ) : health ? (
          <div>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: health.status === "ok" ? "#22c55e" : "#ef4444",
                marginRight: 8,
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {health.status === "ok" ? "Healthy" : "Unhealthy"}
            </span>
            <span style={{ color: "#71717a", marginLeft: 12, fontSize: 13 }}>
              {health.timestamp}
            </span>
          </div>
        ) : (
          <span style={{ color: "#71717a" }}>Checking...</span>
        )}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Endpoints
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {endpoints.map((ep) => (
          <div
            key={`${ep.method}-${ep.path}`}
            style={{
              padding: "14px 18px",
              borderRadius: 8,
              border: "1px solid #27272a",
              backgroundColor: "#18181b",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 4,
                  color: "#000",
                  backgroundColor: methodColors[ep.method] || "#71717a",
                }}
              >
                {ep.method}
              </span>
              <code style={{ fontSize: 14, color: "#e4e4e7" }}>{ep.path}</code>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#a1a1aa" }}>
              {ep.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
