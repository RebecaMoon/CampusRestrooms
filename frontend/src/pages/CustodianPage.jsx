import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import MapPage from "./MapPage";
import { getCurrentUser } from "../services/auth";

export default function CustodianPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const currentUser = await getCurrentUser();

        if (!cancelled) {
          setUser(currentUser);
          setAuthorized(currentUser.role === "custodian");
        }
      } catch {
        if (!cancelled) {
          setAuthorized(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <main className="login-page">
        <p>Verificando sesión...</p>
      </main>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return <MapPage isCustodian />;
}