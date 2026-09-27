import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { Buffer } from "buffer";
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Buffer = (window as any).Buffer || Buffer;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
