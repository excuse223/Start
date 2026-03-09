// API Configuration — auto-detect GitHub Codespaces backend URL
function getBaseUrl() {
  // 1. Explicit env var always wins
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Auto-detect GitHub Codespaces
  //    Codespace URLs look like: https://<name>-<port>.app.github.dev
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Match pattern: <codespace-name>-<port>.app.github.dev
    // The port group is non-capturing; we always replace with the backend port 8000
    const match = hostname.match(/^(.+)-(?:\d+)\.(app\.github\.dev)$/);
    if (match) {
      const codespaceNameBase = match[1]; // e.g. "glorious-train-g6q547gqqpwf999x"
      const domain = match[2];            // "app.github.dev"
      return `https://${codespaceNameBase}-8000.${domain}`;
    }
  }

  // 3. Default: same origin (works with Docker proxy or local dev)
  return '';
}

const BASE_URL = getBaseUrl();
const API_URL = `${BASE_URL}/api`;

export default API_URL;
export { BASE_URL };
