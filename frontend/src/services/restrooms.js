//const API_URL = "http://127.0.0.1:5000/api";
const API_URL = "http://192.168.100.71:5000/api";

export async function getRestrooms() {
  const response = await fetch(`${API_URL}/restrooms`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los baños.");
  }

  const result = await response.json();
  return result.data;
}


export async function getBuildings() {
  const response = await fetch(`${API_URL}/buildings`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los edificios.");
  }

  const result = await response.json();
  return result.data;
}

export async function updateRestroomStatus(restroomId, status) {
  const response = await fetch(
    `${API_URL}/restrooms/${restroomId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ status }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "No se pudo actualizar el estado del baño."
    );
  }

  return result.data;
}
