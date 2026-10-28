import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";
import {
  createCustodian,
  getCustodians,
  updateCustodian,
  updateCustodianStatus,
  deleteCustodian,
} from "../services/users";

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [viewMode, setViewMode] = useState("create");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [custodians, setCustodians] = useState([]);
  const [loadingCustodians, setLoadingCustodians] = useState(true);
  const [listError, setListError] = useState("");
  const [listMessage, setListMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [statusId, setStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  async function loadCustodians() {
    setLoadingCustodians(true);
    setListError("");

    try {
      const users = await getCustodians();
      setCustodians(users);
    } catch (err) {
      setListError(
        err.message || "No se pudieron cargar las cuentas."
      );
    } finally {
      setLoadingCustodians(false);
    }
  }

  useEffect(() => {
    if (authorized) {
      loadCustodians();
    }
  }, [authorized]);

  function handleFieldChange(userId, field, value) {
    setCustodians((current) =>
      current.map((user) =>
        user.id === userId
          ? { ...user, [field]: value }
          : user
      )
    );
  }

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

      await loadCustodians();
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(user) {
    setSavingId(user.id);
    setListError("");
    setListMessage("");

    try {
      const updatedUser = await updateCustodian(user.id, {
        username: user.username.trim(),
        full_name: user.full_name.trim(),
        password: user.password || "",
      });

      setCustodians((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...updatedUser, password: "" }
            : item
        )
      );

      setListMessage(
        `Se guardaron los cambios de ${updatedUser.full_name}.`
      );
    } catch (err) {
      setListError(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleStatus(user) {
    const action = user.is_active ? "desactivar" : "activar";

    if (
      !window.confirm(
        `¿Seguro que deseas ${action} la cuenta de ${user.full_name}?`
      )
    ) {
      return;
    }

    setStatusId(user.id);
    setListError("");
    setListMessage("");

    try {
      const updatedUser = await updateCustodianStatus(
        user.id,
        !user.is_active
      );

      setCustodians((current) =>
        current.map((item) =>
          item.id === user.id
            ? { ...item, ...updatedUser }
            : item
        )
      );

      setListMessage(
        `La cuenta se ${updatedUser.is_active ? "activó" : "desactivó"} correctamente.`
      );
    } catch (err) {
      setListError(
        err.message || "No se pudo cambiar el estado de la cuenta."
      );
    } finally {
      setStatusId(null);
    }
  }

  async function handleDelete(user) {
    if (
      !window.confirm(
        `¿Deseas eliminar permanentemente la cuenta de ${user.full_name} (${user.username})? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setDeletingId(user.id);
    setListError("");
    setListMessage("");

    try {
      await deleteCustodian(user.id);

      setCustodians((current) =>
        current.filter((item) => item.id !== user.id)
      );

      setListMessage(
        `La cuenta de ${user.full_name} se eliminó correctamente.`
      );
    } catch (err) {
      setListError(err.message || "No se pudo eliminar la cuenta.");
    } finally {
      setDeletingId(null);
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

              <Link to="/admin/map" className="admin-map-button">
                Ver mapa
              </Link>

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


        <div className="admin-view-switch">
          <button
            type="button"
            className="admin-view-button"
            onClick={() =>
              setViewMode((current) =>
                current === "create" ? "edit" : "create"
              )
            }
          >
            {viewMode === "create"
              ? "Ver cuentas y editar"
              : "Volver a crear cuenta"}
          </button>

          <p>
            {viewMode === "create"
              ? "Registra un nuevo intendente."
              : "Edita las cuentas registradas."}
          </p>
        </div>


          <span className="admin-eyebrow">
            PANEL DE ADMINISTRACIÓN
          </span>

          <h2>Gestión de intendentes</h2>

      
        </div>

        {viewMode === "create" && (
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
          )}


        {viewMode === "edit" && (
        <section className="admin-card admin-list-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon" aria-hidden="true">
              <span aria-hidden="true">≡</span>
            </div>

            <div>
              <h3>Cuentas de intendentes</h3>
              <p>
                {custodians.length}{" "}
                {custodians.length === 1
                  ? "cuenta registrada"
                  : "cuentas registradas"}
              </p>
            </div>
          {/*
            <button
              type="button"
              className="admin-refresh"
              onClick={loadCustodians}
              disabled={loadingCustodians}
            >
              {loadingCustodians ? "Cargando..." : "Actualizar"}
            </button>
            */}
          </div>

          {listError && (
            <p className="admin-feedback error" role="alert">
              {listError}
            </p>
          )}

          {listMessage && (
            <p className="admin-feedback success" role="status">
              {listMessage}
            </p>
          )}

          {loadingCustodians ? (
            <p className="admin-list-empty">
              Cargando cuentas...
            </p>
          ) : custodians.length === 0 ? (
            <p className="admin-list-empty">
              No hay cuentas de intendentes registradas.
            </p>
          ) : (
            <div className="admin-custodian-list">
              {custodians.map((user) => (
                <article className="admin-custodian" key={user.id}>
                  <div className="admin-custodian-top">
                    <div>
                      <span className="admin-custodian-id">
                        CUENTA #{user.id}
                      </span>
                      <span
                        className={`admin-status ${
                          user.is_active ? "active" : "inactive"
                        }`}
                      >
                        {user.is_active ? "Activa" : "Desactivada"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-custodian-fields">
                    <div className="login-field">
                      <label htmlFor={`name-${user.id}`}>
                        Nombre completo
                      </label>
                      <input
                        id={`name-${user.id}`}
                        type="text"
                        maxLength={120}
                        value={user.full_name}
                        onChange={(event) =>
                          handleFieldChange(
                            user.id,
                            "full_name",
                            event.target.value
                          )
                        }
                        disabled={savingId === user.id}
                      />
                    </div>

                    <div className="login-field">
                      <label htmlFor={`username-${user.id}`}>
                        Nombre de usuario
                      </label>
                      <input
                        id={`username-${user.id}`}
                        type="text"
                        maxLength={50}
                        value={user.username}
                        onChange={(event) =>
                          handleFieldChange(
                            user.id,
                            "username",
                            event.target.value
                          )
                        }
                        disabled={savingId === user.id}
                      />
                    </div>

                    <div className="login-field">
                      <label htmlFor={`password-${user.id}`}>
                        Nueva contraseña (opcional)
                      </label>
                      <input
                        id={`password-${user.id}`}
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        placeholder="Dejar vacío para conservarla"
                        value={user.password || ""}
                        onChange={(event) =>
                          handleFieldChange(
                            user.id,
                            "password",
                            event.target.value
                          )
                        }
                        disabled={savingId === user.id}
                      />
                      <span className="admin-field-hint">
                        Si la cambias, debe tener al menos 12 caracteres.
                      </span>
                    </div>
                  </div>

                  <div className="admin-custodian-actions">
                    <button
                      type="button"
                      className="admin-submit admin-save"
                      onClick={() => handleSave(user)}
                      disabled={
                        savingId === user.id ||
                        statusId === user.id ||
                        deletingId === user.id
                      }
                    >
                      {savingId === user.id
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>

                    <button
                      type="button"
                      className="admin-secondary"
                      onClick={() => handleToggleStatus(user)}
                      disabled={
                        savingId === user.id ||
                        statusId === user.id ||
                        deletingId === user.id
                      }
                    >
                      {statusId === user.id
                        ? "Actualizando..."
                        : user.is_active
                          ? "Desactivar"
                          : "Activar"}
                    </button>

                    <button
                      type="button"
                      className="admin-delete"
                      onClick={() => handleDelete(user)}
                      disabled={
                        savingId === user.id ||
                        statusId === user.id ||
                        deletingId === user.id
                      }
                    >
                      {deletingId === user.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        )}
      </section>
    </main>
  );
}