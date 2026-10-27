import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";
import { createCustodian } from "../services/users";

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const user = await getCurrentUser();

        if (!cancelled) {
          setAuthorized(user.role === "admin");
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

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");
    setCreatedUser(null);

    try {
      const user = await createCustodian({
        full_name: fullName.trim(),
        username: username.trim(),
        password,
      });

      setCreatedUser(user);
      setMessage("La cuenta de intendente se creó correctamente.");

      setFullName("");
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      await logout();
      window.location.replace("/login");
    } catch {
      setError("No fue posible cerrar la sesión. Inténtalo de nuevo.");
      setLoggingOut(false);
    }
  }

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

  return (
    <main className="admin-page">
      <header className="map-header">
        <div className="map-header-content">
          <Link to="/" className="brand admin-brand">
            <div className="brand-mark" aria-hidden="true">
              wc
            </div>

            <div className="brand-text">
              <h1>CUCEI</h1>
              <span>Servicios sanitarios del campus</span>
            </div>
          </Link>

          <div className="admin-header-actions">
            <span className="admin-role">Administración</span>

            <button
              type="button"
              className="admin-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-intro">
          <span className="admin-eyebrow">
            PANEL DE ADMINISTRACIÓN
          </span>

          <h2>Gestión de intendentes</h2>

          <p>
            Crea cuentas para el personal encargado de mantener
            actualizada la disponibilidad de los baños del campus.
          </p>
        </div>

        <section className="admin-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon" aria-hidden="true">
              +
            </div>

            <div>
              <h3>Crear cuenta</h3>
              <p>Registra un nuevo intendente.</p>
            </div>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="full-name">Nombre completo</label>

              <input
                id="full-name"
                type="text"
                autoComplete="name"
                placeholder="Nombre y apellidos"
                maxLength={120}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="new-username">Nombre de usuario</label>

              <input
                id="new-username"
                type="text"
                autoComplete="off"
                placeholder="Ej. intendente01"
                maxLength={50}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="new-password">Contraseña</label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 12 caracteres"
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
              />

              <span className="admin-field-hint">
                La contraseña debe tener al menos 12 caracteres.
              </span>
            </div>

            {error && (
              <p className="admin-feedback error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <div className="admin-feedback success" role="status">
                <strong>{message}</strong>

                {createdUser && (
                  <p>
                    Usuario: <strong>{createdUser.username}</strong>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="admin-submit"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta de intendente"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}