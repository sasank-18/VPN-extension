// background.js — service worker for proxy set/reset and IP check
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_PROXY') {
    const { host, port, scheme } = msg.proxy;

    const config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: scheme || "http",
          host: host,
          port: Number(port)
        }
      }
    };

    chrome.proxy.settings.set({ value: config, scope: "regular" }, async () => {
      try {
        // Test the new IP from the background (so request goes through the applied proxy)
        const res = await fetch("https://api.ipify.org?format=json");
        const j = await res.json();
        sendResponse({ success: true, ip: j.ip });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });

    return true; // keep channel open for async sendResponse
  }

  if (msg.type === 'CLEAR_PROXY') {
    chrome.proxy.settings.clear({ scope: "regular" }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (msg.type === 'GET_IP') {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(j => sendResponse({ success: true, ip: j.ip }))
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
});
