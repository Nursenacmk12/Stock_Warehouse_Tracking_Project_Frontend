import { Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Register from "./pages/Register.jsx";
import "./App.css";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default AppRouter;