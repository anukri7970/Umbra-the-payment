// Browser polyfill for isomorphic-ws — replaces Node.js ws package in browser builds
const WS = typeof window !== "undefined" ? window.WebSocket : typeof globalThis !== "undefined" ? globalThis.WebSocket : null;
export { WS as WebSocket };
export default WS;
