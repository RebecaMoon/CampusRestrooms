const API_URL = "/api";

async function requestUsers(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "No se pudo completar la operación."
    );
  }

  return result;
}

export async function getCustodians() {
  const result = await requestUsers("/users");
  return result.data;
}

export async function createCustodian({
  username,
  full_name,
  password,
}) {
  const result = await requestUsers("/users", {
    method: "POST",
    body: JSON.stringify({
      username,
      full_name,
      password,
    }),
  });

  return result.data;
}

export async function updateCustodian(
  userId,
  { username, full_name, password }
) {
  const result = await requestUsers(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({
      username,
      full_name,
      password: password || "",
    }),
  });

  return result.data;
}

export async function updateCustodianStatus(userId, isActive) {
  const result = await requestUsers(`/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      is_active: isActive,
    }),
  });

  return result.data;
}

export async function deleteCustodian(userId) {
  const result = await requestUsers(`/users/${userId}`, {
    method: "DELETE",
  });

  return result.data;
}