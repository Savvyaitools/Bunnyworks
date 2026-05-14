import { createRoot } from "react-dom/client";
import { setupGlobalErrorHandlers } from "@/core/globalErrorHandler";
import App from "./App.tsx";
import "./index.css";

// Initialize global error catching before render
setupGlobalErrorHandlers();

// No service worker is shipped with the app. Proactively unregister any
// stale SW left over from previous deploys and purge its caches — otherwise
// users keep seeing old asset bundles and the page reload-loops whenever the
// SW state changes.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
  });
  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

createRoot(document.getElementById("root")!).render(<App />);
