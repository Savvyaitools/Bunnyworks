import { createRoot } from "react-dom/client";
import { setupGlobalErrorHandlers } from "@/core/globalErrorHandler";
import App from "./App.tsx";
import "./index.css";

// Initialize global error catching before render
setupGlobalErrorHandlers();

// Force service worker update & clear stale caches on every load
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => {
      reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    });
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!reloading) {
      reloading = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
