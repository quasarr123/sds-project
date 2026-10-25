/**
 * Entry point for the React app. Mounts <App /> into #root.
 * Included from src/index.html.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// `import.meta.hot` only exists under a dev server (Vite/Bun HMR); it is undefined in production builds.
const hot = (import.meta as any).hot;
if (hot) {
  (hot.data.root ??= createRoot(elem)).render(app);
} else {
  createRoot(elem).render(app);
}
