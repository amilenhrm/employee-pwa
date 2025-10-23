import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/employee-pwa/sw.js')   // 👈 correct sub-folder path
      .then(reg => console.log('✅ SW registered: ', reg))
      .catch(err => console.error('❌ SW registration failed: ', err))
  });
}
import { setupPWAUpdate } from './swUpdate'

// Enable auto-update checking
setupPWAUpdate()
