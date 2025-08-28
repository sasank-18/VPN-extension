export async function getPublicIP() {
  const res = await fetch("https://api.ipify.org?format=json");
  if (!res.ok) throw new Error("Failed to fetch IP");
  const j = await res.json();
  return j.ip;
}
