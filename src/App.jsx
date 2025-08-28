import React, { useEffect, useState } from "react";
import { getPublicIP } from "./services/ipService";
import { fetchProxies } from "./services/proxySevice";

export default function App() {
  const [beforeIP, setBeforeIP] = useState(null);
  const [afterIP, setAfterIP] = useState(null);
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProxy, setActiveProxy] = useState(null);
  const [error, setError] = useState("");

  // get current IP when popup opens (normal browser IP)
  useEffect(() => {
    (async () => {
      try {
        const ip = await getPublicIP();
        setBeforeIP(ip);
      } catch (e) {
        setError("Failed to fetch current IP: " + e.message);
      }
    })();

    // also fetch list of proxies
    (async () => {
      try {
        const proxyList = await fetchProxies();
        setProxies(proxyList || []);
      } catch (e) {
        setError("Failed to fetch proxies: " + e.message);
      }
    })();
  }, []);

  const handleConnectProxy = async (proxy) => {
    setError("");
    setLoading(true);
    setActiveProxy(proxy);

    chrome.runtime.sendMessage(
      {
        type: "SET_PROXY",
        proxy: {
          host: proxy.ip || proxy.host,
          port: proxy.port,
          scheme: proxy.protocol || "http",
        },
      },
      (res) => {
        setLoading(false);
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message);
          setActiveProxy(null);
          return;
        }
        if (res && res.success) {
          setAfterIP(res.ip); // IP after proxy applied
        } else {
          setError(res?.error || "Failed to set proxy");
          setActiveProxy(null);
        }
      }
    );
  };

  const handleClearProxy = () => {
    setError("");
    chrome.runtime.sendMessage({ type: "CLEAR_PROXY" }, (res) => {
      if (res && res.success) {
        setAfterIP(null);
        setActiveProxy(null);
        // refresh beforeIP
        getPublicIP().then((ip) => setBeforeIP(ip)).catch(() => {});
      } else {
        setError("Failed to clear proxy");
      }
    });
  };

  return (
    <div style={{ padding: 12, width: 340, fontFamily: "Arial, sans-serif" }}>
      <h3>VPN-Like Proxy Switcher</h3>

      <div style={{ marginBottom: 8 }}>
        <strong>Your IP (before):</strong>
        <div>{beforeIP || "Loading..."}</div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Proxied IP (after):</strong>
        <div>{afterIP || "Not connected"}</div>
      </div>

      <div style={{ marginTop: 12, marginBottom: 10 }}>
        <button onClick={handleClearProxy}>Reset Proxy</button>
      </div>

      <div>
        <h4>Available Proxies</h4>
        {loading && <div>Connecting...</div>}
        {!loading && proxies.length === 0 && (
          <div>No proxies available</div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {proxies.map((p, i) => (
            <li
              key={i}
              style={{
                padding: "6px 8px",
                border: "1px solid #ccc",
                marginBottom: 6,
                borderRadius: 6,
                background:
                  activeProxy?.ip === p.ip ? "#e3f2fd" : "#fafafa",
                cursor: "pointer",
              }}
              onClick={() => handleConnectProxy(p)}
            >
              <strong style={{color: "black"}}>{p.ip}:{p.port}</strong> <span style={{color: "black"}}>({p.country || "Unknown"})</span>
            </li>
          ))}
        </ul>
      </div>

      {activeProxy && (
        <div style={{ marginTop: 12 }}>
          <small>
            Active Proxy: {activeProxy.ip}:{activeProxy.port} (
            {activeProxy.protocol || "http"})
          </small>
        </div>
      )}

      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      <hr />
      <small style={{ color: "#666" }}>
        Note: free proxies are unreliable. This is a demo — not a secure VPN.
      </small>
    </div>
  );
}
