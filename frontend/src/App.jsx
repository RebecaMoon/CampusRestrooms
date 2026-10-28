import { Routes, Route, Navigate } from "react-router-dom";
import MapPage from "./pages/MapPage";
import LoginPage from "./pages/LoginPage";
import CustodianPage from "./pages/CustodianPage";
import AdminPage from "./pages/AdminPage";
import "./App.css";

function CustodianPlaceholder() {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark" aria-hidden="true">
          wc
        </div>

        <h2>Sesión iniciada</h2>

        <p>
          La autenticación fue correcta. El panel de
          intendentes se desarrollará en el siguiente paso.
        </p>

        <button
          className="login-submit"
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          Volver al inicio de sesión
        </button>

        <a href="/" className="login-back">
          Volver al mapa público
        </a>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/custodian" element={<CustodianPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/map" element={<MapPage isAdmin />}/>
    </Routes>
  );
}