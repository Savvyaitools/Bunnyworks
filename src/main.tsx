import { createRoot } from "react-dom/client";
import { setupGlobalErrorHandlers } from "@/core/globalErrorHandler";
import App from "./App.tsx";
import "./index.css";

// Initialize global error catching before render
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
