import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const yellowIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const blueIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const redIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 14, { duration: 0.7 });
  }, [center, map]);

  return null;
}

function MapClickHandler({ onPickLocation }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onPickLocation(lat, lng);
    },
  });

  return null;
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#1e2647",
    color: "white",
    boxSizing: "border-box",
    outline: "none",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "8px",
    fontWeight: "bold",
  };

  const smallButtonStyle = {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const clearSession = (msg = "Logged out") => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setIssues([]);
    setEmail("");
    setPassword("");
    setFilter("All");
    setSelectedLocation(null);
    setSelectedIssueId(null);
    setMessage(msg);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setLatitude(lat);
        setLongitude(lng);
        setSelectedLocation([Number(lat), Number(lng)]);
        setSelectedIssueId(null);
        setMessage("Location auto-filled");
      },
      () => {
        setMessage("Failed to get location");
      }
    );
  };

  const handlePickLocationFromMap = (lat, lng) => {
    const roundedLat = lat.toFixed(4);
    const roundedLng = lng.toFixed(4);

    setLatitude(roundedLat);
    setLongitude(roundedLng);
    setSelectedLocation([Number(roundedLat), Number(roundedLng)]);
    setSelectedIssueId(null);
    setMessage("Location selected from map");
  };

  const fetchMyIssues = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIssues([]);
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get("http://127.0.0.1:8000/my-issues", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIssues(res.data);
      setMessage("");
    } catch (err) {
      console.error("Failed to load issues:", err);

      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        clearSession("Session expired. Please log in again.");
      } else {
        setIssues([]);
        setMessage("Failed to load issues");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await axios.post("http://127.0.0.1:8000/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.access_token);
      setIsLoggedIn(true);
      setMessage("Login successful!");
      await fetchMyIssues();
    } catch (err) {
      console.error("Login failed:", err);
      setMessage("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first");
      return;
    }

    if (!title || !description || !category || !latitude || !longitude) {
      setMessage("Please fill in all issue fields");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://127.0.0.1:8000/issues",
        {
          title,
          description,
          category,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Issue created successfully!");
      setTitle("");
      setDescription("");
      setCategory("");
      setLatitude("");
      setLongitude("");
      setSelectedIssueId(null);
      await fetchMyIssues();
    } catch (err) {
      console.error("Failed to create issue:", err);

      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        clearSession("Session expired. Please log in again.");
      } else {
        setMessage("Failed to create issue");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession("Logged out");
  };

  const handleResolveIssue = async (issueId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first");
      return;
    }

    try {
      setLoading(true);

      await axios.put(
        `http://127.0.0.1:8000/issues/${issueId}/status`,
        { status: "Resolved" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Issue marked as resolved!");
      await fetchMyIssues();
    } catch (err) {
      console.error("Failed to update issue:", err);

      const status = err?.response?.status;

      if (status === 401 || status === 403) {
        clearSession("Session expired. Please log in again.");
      } else {
        setMessage("Failed to update issue");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = useMemo(() => {
    if (filter === "All") return issues;
    return issues.filter((issue) => issue.status === filter);
  }, [issues, filter]);

  const draftLocation = useMemo(() => {
    if (!latitude || !longitude) return null;
    return [Number(latitude), Number(longitude)];
  }, [latitude, longitude]);

  const mapCenter = useMemo(() => {
    if (selectedLocation) return selectedLocation;
    if (filteredIssues.length > 0) {
      return [filteredIssues[0].latitude, filteredIssues[0].longitude];
    }
    return [43.6532, -79.3832];
  }, [filteredIssues, selectedLocation]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchMyIssues();
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1020",
        fontFamily: "Arial",
        color: "white",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "34px" }}>Smart Issue Reporting</h1>

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              style={{
                ...smallButtonStyle,
                background: "#ef4444",
                color: "white",
              }}
            >
              Logout
            </button>
          )}
        </div>

        {!isLoggedIn ? (
          <div
            style={{
              maxWidth: "420px",
              margin: "60px auto 0",
              background: "#121933",
              borderRadius: "14px",
              padding: "30px",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            <h2 style={{ marginBottom: "16px" }}>Login</h2>

            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            <button onClick={handleLogin} style={buttonStyle} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.1fr 1.1fr",
              gap: "24px",
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#121933",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              <p style={{ marginTop: 0, color: "#cbd5e1" }}>You are logged in.</p>

              <h2 style={{ marginTop: "10px", marginBottom: "18px" }}>Create Issue</h2>

              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />

              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={inputStyle}
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select category</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Road Damage">Road Damage</option>
                <option value="Garbage">Garbage</option>
                <option value="Graffiti">Graffiti</option>
                <option value="Water Leak">Water Leak</option>
              </select>

              <input
                type="text"
                placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                style={inputStyle}
              />

              <input
                type="text"
                placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                style={inputStyle}
              />

              <button
                onClick={handleGetLocation}
                style={{ ...buttonStyle, background: "#22c55e" }}
              >
                Use My Location
              </button>

              <button
                onClick={handleCreateIssue}
                style={buttonStyle}
                disabled={loading}
              >
                {loading ? "Working..." : "Submit Issue"}
              </button>
            </div>

            <div
              style={{
                background: "#121933",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ margin: 0 }}>My Issues</h2>

                <div style={{ display: "flex", gap: "8px" }}>
                  {["All", "Pending", "Resolved"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      style={{
                        ...smallButtonStyle,
                        background: filter === status ? "#4f46e5" : "#1e2647",
                        color: "white",
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <p style={{ color: "#cbd5e1", textAlign: "center" }}>Loading...</p>
              )}

              {!loading && filteredIssues.length === 0 ? (
                <p style={{ color: "#cbd5e1" }}>No issues found.</p>
              ) : (
                <div>
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => {
                        setSelectedLocation([issue.latitude, issue.longitude]);
                        setSelectedIssueId(issue.id);
                      }}
                      style={{
                        cursor: "pointer",
                        background:
                          selectedIssueId === issue.id ? "#2b3a6b" : "#1e2647",
                        padding: "15px",
                        borderRadius: "10px",
                        marginBottom: "12px",
                        border:
                          selectedIssueId === issue.id
                            ? "2px solid #4f46e5"
                            : "2px solid transparent",
                        transform:
                          selectedIssueId === issue.id ? "scale(1.02)" : "scale(1)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <strong>{issue.title}</strong>{" "}
                        <span
                          style={{
                            color:
                              issue.status === "Resolved"
                                ? "#22c55e"
                                : issue.status === "Pending"
                                ? "#facc15"
                                : "#60a5fa",
                          }}
                        >
                          - {issue.status}
                        </span>
                      </div>

                      <div style={{ marginBottom: "6px" }}>{issue.description}</div>

                      <div style={{ fontSize: "14px", color: "#cbd5e1" }}>
                        Category: {issue.category}
                      </div>

                      <div style={{ fontSize: "14px", color: "#cbd5e1" }}>
                        Location: {issue.latitude}, {issue.longitude}
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <a
                          href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: "#60a5fa",
                            fontSize: "13px",
                            textDecoration: "none",
                          }}
                        >
                          View on Map
                        </a>

                        {issue.status !== "Resolved" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveIssue(issue.id);
                            }}
                            style={{
                              marginLeft: "12px",
                              padding: "8px 12px",
                              background: "#22c55e",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            Mark as Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                background: "#121933",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Issue Map</h2>

              <div style={{ marginBottom: "10px", fontSize: "14px" }}>
                🔵 Selected &nbsp;&nbsp; 🟢 Resolved &nbsp;&nbsp; 🟡 Pending
                <br />
                🔴 New issue location
              </div>

              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  style={{ height: "500px", width: "100%" }}
                >
                  <RecenterMap center={mapCenter} />
                  <MapClickHandler onPickLocation={handlePickLocationFromMap} />

                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {filteredIssues.map((issue) => {
                    let icon;

                    if (issue.id === selectedIssueId) {
                      icon = blueIcon;
                    } else if (issue.status === "Resolved") {
                      icon = greenIcon;
                    } else {
                      icon = yellowIcon;
                    }

                    return (
                      <Marker
                        key={issue.id}
                        position={[issue.latitude, issue.longitude]}
                        icon={icon}
                        eventHandlers={{
                          click: () => {
                            setSelectedIssueId(issue.id);
                            setSelectedLocation([
                              issue.latitude,
                              issue.longitude,
                            ]);
                          },
                        }}
                      >
                        <Popup>
                          <strong>{issue.title}</strong>
                          <br />
                          {issue.description}
                          <br />
                          Status: {issue.status}
                        </Popup>
                      </Marker>
                    );
                  })}

                  {draftLocation && (
                    <Marker position={draftLocation} icon={redIcon}>
                      <Popup>New issue location</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div
            style={{
              maxWidth: !isLoggedIn ? "420px" : "1250px",
              margin: "18px auto 0",
              padding: "10px",
              borderRadius: "8px",
              background: message.toLowerCase().includes("failed")
                ? "#7f1d1d"
                : "#14532d",
              color: "white",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;