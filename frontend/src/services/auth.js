const API_URL = "/api";

export async function login(username, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "No fue posible iniciar sesión."
    );
  }

  return result.data;
}

export async function logout() {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("No fue posible cerrar la sesión.");
  }

  return response.json();
}

export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("No hay una sesión activa.");
  }

  const result = await response.json();
  return result.data;
}