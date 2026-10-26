import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, logout } from "../services/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(username.trim(), password);

      // Por ahora, este acceso es para intendentes.
      if (user.role !== "custodian") {
        try {
          await logout();
        } catch {
          // No ocultar el mensaje de acceso denegado.
        }

        setError(
          "Esta cuenta no tiene acceso al panel de intendentes."
        );
        return;
      }

      navigate("/custodian", {
        replace: true,
        state: { user },
      });
    } catch (err) {
      setError(
        err.message ||
          "No fue posible conectar con el servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Link
          to="/"
          className="login-brand"
          aria-label="Volver al mapa de wc CUCEI"
        >
          <div className="brand-mark" aria-hidden="true">
            wc
          </div>

          <div className="login-brand-text">
            <h1>CUCEI</h1>
            <span>Servicios sanitarios del campus</span>
          </div>
        </Link>

        <div className="login-heading">
          <h2>Bienvenido</h2>
          <p>
            Inicia sesión para administrar los baños del campus.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="username">
              Nombre de usuario
            </label>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <Link to="/" className="login-back">
          Volver al mapa
        </Link>
      </section>
    </main>
  );
}