const API_URL = "http://192.168.100.71:5000/api";

export async function createCustodian({
  username,
  full_name,
  password,
}) {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username,
      full_name,
      password,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "No se pudo crear la cuenta."
    );
  }

  return result.data;
}
