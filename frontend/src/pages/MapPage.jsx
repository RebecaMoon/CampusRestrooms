import { useEffect, useState } from "react";
import {
  ImageOverlay,
  MapContainer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import campusMap from "../assets/campus-map.png";

import {
  getRestrooms,
  getBuildings,
} from "../services/restrooms";

const MAP_WIDTH = 895;
const MAP_HEIGHT = 1756;

const IMAGE_BOUNDS = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
];

const STATUS_CONFIG = {
  available: {
    label: "Disponible",
    color: "#16a34a",
  },
  maintenance: {
    label: "En mantenimiento",
    color: "#f59e0b",
  },
  out_of_service: {
    label: "Fuera de servicio",
    color: "#dc2626",
  },
};

function createRestroomIcon(status) {
  const color =
    STATUS_CONFIG[status]?.color ?? "#64748b";

  return L.divIcon({
    className: "restroom-marker-wrapper",
    html: `
      <div
        class="restroom-marker"
        style="--marker-color: ${color}"
        aria-label="${STATUS_CONFIG[status]?.label ?? "Estado desconocido"}"
      >
        <span></span>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -16],
  });
}


function createBuildingIcon(name) {
  const label = String(name)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return L.divIcon({
    className: "building-marker-wrapper",
    html: `<div class="building-label">${label}</div>`,
    iconSize: [100, 28],
    iconAnchor: [50, 14],
  });
}


function FitCampusMap() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(IMAGE_BOUNDS);
  }, [map]);

  return null;
}

function RestroomDetails({ restroom }) {
  const status =
    STATUS_CONFIG[restroom.status] ?? {
      label: "Estado desconocido",
      color: "#64748b",
    };

  return (
    <div className="restroom-popup">
      <h3
        style={{
          color:
            restroom.name === "Mujeres"
              ? "#ec4899"
              : restroom.name === "Hombres"
                ? "#3b82f6"
                : "#1f2937",
        }}
      >
        {restroom.name}
      </h3>

      <span
        className="status-badge"
        style={{
          "--status-color": status.color,
        }}
      >
        {status.label}
      </span>

      {restroom.description && (
        <p className="restroom-description">
          {restroom.description}
        </p>
      )}
    </div>
  );
}

export default function MapPage() {
  const [buildings, setBuildings] = useState([]);
  const [buildingError, setBuildingError] = useState("");
  const [restrooms, setRestrooms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRestrooms() {
      try {
        const data = await getRestrooms();

        if (!cancelled) {
          setRestrooms(data);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError(
            "No fue posible cargar los baños. Verifica que el backend esté activo."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    async function loadBuildings() {
      try {
        const data = await getBuildings();

        if (!cancelled) {
          setBuildings(data);
          setBuildingError("");
        }
      } catch {
        if (!cancelled) {
          setBuildingError(
            "No fue posible cargar los edificios."
          );
        }
      }
    }


    loadRestrooms();
    loadBuildings();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="map-page">
      <header className="map-header">
        <h1>CampusRestrooms</h1>
        <p>
          Consulta la disponibilidad de los baños del campus.
        </p>
      </header>

      {loading && (
        <p className="map-message">
          Cargando baños...
        </p>
      )}

      {error && (
        <p className="map-error" role="alert">
          {error}
        </p>
      )}
      {buildingError && (
        <p className="map-error" role="alert">
          {buildingError}
        </p>
      )}

      <section className="map-container">
        <MapContainer
          crs={L.CRS.Simple}
          bounds={IMAGE_BOUNDS}
          minZoom={-2}
          maxZoom={2}
          zoomSnap={0.25}
          scrollWheelZoom
          className="campus-map"
        >
          <FitCampusMap />

          <ImageOverlay
            url={campusMap}
            bounds={IMAGE_BOUNDS}
          />


          {buildings.map((building) => (
            <Marker
              key={`building-${building.id}`}
              position={[
                MAP_HEIGHT - building.map_y,
                building.map_x,
              ]}
              icon={createBuildingIcon(building.name)}
              interactive={false}
              keyboard={false}
            />
          ))}


          {restrooms.map((restroom) => (
            <Marker
              key={restroom.id}
              position={[
                MAP_HEIGHT - restroom.map_y,
                restroom.map_x,
              ]}
              icon={createRestroomIcon(restroom.status)}
            >
              <Popup>
                <RestroomDetails restroom={restroom} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>

      <section className="map-footer">
        <p className="restroom-count">
          {loading
            ? "Cargando disponibilidad..."
            : `${restrooms.length} baños registrados`}
        </p>

        <div className="map-legend">
          {Object.entries(STATUS_CONFIG).map(
            ([status, config]) => (
              <div className="legend-item" key={status}>
                <span
                  className="legend-dot"
                  style={{ backgroundColor: config.color }}
                />
                {config.label}
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}