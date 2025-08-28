// proxyService.js
export async function fetchProxies() {
  const url =
    "https://api.proxyscrape.com/v4/free-proxy-list/get?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all&skip=0&limit=10&format=json";

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch proxy list");

  const data = await res.json();
  return data.proxies.map(p => ({
    ip: p.ip,
    port: p.port,
    protocol: p.protocol,
    country: p.ip_data?.country || "Unknown",
    city: p.ip_data?.city || "",
    isp: p.ip_data?.isp || "",
  }));
}
