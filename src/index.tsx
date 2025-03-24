import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import OrderProgress from "./components/OrderProgress/OrderProgress"; // Import OrderProgress
import ProgressInformation from "./components/ProgressInformation/ProgressInformation"; // Import ProgressInformation

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/progress-information" element={<ProgressInformation />} />
        <Route path="/progress/:orderId" element={<OrderProgress />} /> {/* Route đúng */}
        {/* ...existing routes... */}
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);