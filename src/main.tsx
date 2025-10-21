import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Database initialization is now handled automatically in the database module
// No need for async initialization with localStorage approach
createRoot(document.getElementById("root")!).render(<App />);
