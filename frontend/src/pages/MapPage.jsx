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
  updateRestroomStatus,
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
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -21],
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
    map.setZoom(map.getZoom() + 0.75);
  }, [map]);

  return null;
}


function RestroomDetails({
  restroom,
  isCustodian = false,
  onStatusChange,
  updating = false,
}) {
  const status =
    STATUS_CONFIG[restroom.status] ?? {
      label: "Estado desconocido",
      color: "#64748b",
    };

  const statusOptions = [
    {
      value: "available",
      label: "Disponible",
    },
    {
      value: "maintenance",
      label: "En mantenimiento",
    },
    {
      value: "out_of_service",
      label: "Fuera de servicio",
    },
  ];

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
        style={{ "--status-color": status.color }}
      >
        {status.label}
      </span>

      {restroom.description && (
        <p className="restroom-description">
          {restroom.description}
        </p>
      )}

      {isCustodian && (
        <div className="restroom-status-controls">
          <p className="status-controls-title">
            Cambiar estado
          </p>

          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`status-action ${
                restroom.status === option.value
                  ? "selected"
                  : ""
              }`}
              disabled={
                updating || restroom.status === option.value
              }
              onClick={() =>
                onStatusChange(restroom.id, option.value)
              }
            >
              <span>{option.label}</span>

              {restroom.status === option.value && (
                <span aria-label="Estado actual">✓</span>
              )}
            </button>
          ))}

          {updating && (
            <p className="status-saving" role="status">
              Guardando cambio...
            </p>
          )}
        </div>
      )}
    </div>
  );
}



export default function MapPage({ isCustodian = false }) {
  const [buildings, setBuildings] = useState([]);
  const [buildingError, setBuildingError] = useState("");
  const [restrooms, setRestrooms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingRestroomId, setUpdatingRestroomId] = useState(null);
  const [statusUpdateError, setStatusUpdateError] = useState("");


  const [genderFilter, setGenderFilter] = useState(null);

  const visibleRestrooms = genderFilter
  ? restrooms.filter(
      (restroom) =>
        restroom.name?.toLowerCase() ===
          genderFilter.toLowerCase() &&
        restroom.status === "available"
    )
  : restrooms;

  function toggleGenderFilter(gender) {
    setGenderFilter((current) =>
      current === gender ? null : gender
    );
  }


  async function handleStatusChange(restroomId, newStatus) {
    setUpdatingRestroomId(restroomId);
    setStatusUpdateError("");

    try {
      await updateRestroomStatus(restroomId, newStatus);

      setRestrooms((current) =>
        current.map((restroom) =>
          restroom.id === restroomId
            ? { ...restroom, status: newStatus }
            : restroom
        )
      );
    } catch (err) {
      setStatusUpdateError(
        err.message || "No se pudo actualizar el baño."
      );
    } finally {
      setUpdatingRestroomId(null);
    }
  }


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

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    async function refreshRestrooms() {
      try {
        const data = await getRestrooms();

        if (!cancelled) {
          setRestrooms((current) => {
            const hasChanges =
              current.length !== data.length ||
              data.some((next) => {
                const previous = current.find(
                  (restroom) => restroom.id === next.id
                );

                return (
                  !previous ||
                  previous.status !== next.status ||
                  previous.activo !== next.activo ||
                  previous.map_x !== next.map_x ||
                  previous.map_y !== next.map_y
                );
              });

            return hasChanges ? data : current;
          });
        }
      } catch {
        // Si falla una consulta, se conserva el último estado.
      }

      if (!cancelled) {
        timeoutId = setTimeout(refreshRestrooms, 5000);
      }
    }

    timeoutId = setTimeout(refreshRestrooms, 5000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);



  

  return (
    <main
      className={`map-page ${isCustodian ? "map-page--custodian" : ""}`}
    >
      
    
    <header className="map-header">
      <div className="map-header-content">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            wc
          </div>

          <div className="brand-text">
            <h1>CUCEI</h1>
            <span>Servicios sanitarios</span>
          </div>
        </div>

        <div className="header-actions">
          <p className="header-description">
            Encuentra un baño disponible.
          </p>

          <div className="gender-filters" aria-label="Filtrar baños">
            <button
              type="button"
              className={`gender-button ${
                genderFilter === "Hombres" ? "active men" : ""
              }`}
              aria-pressed={genderFilter === "Hombres"}
              onClick={() => toggleGenderFilter("Hombres")}
            >
              <span className="gender-symbol" aria-hidden="true">
                ♂
              </span>
              Hombres
            </button>

            <button
              type="button"
              className={`gender-button ${
                genderFilter === "Mujeres" ? "active women" : ""
              }`}
              aria-pressed={genderFilter === "Mujeres"}
              onClick={() => toggleGenderFilter("Mujeres")}
            >
              <span className="gender-symbol" aria-hidden="true">
                ♀
              </span>
              Mujeres
            </button>
          </div>
        </div>
      </div>
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
      {statusUpdateError && isCustodian && (
        <p className="map-error" role="alert">
          {statusUpdateError}
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


          {visibleRestrooms.map((restroom) => (
            <Marker
              key={restroom.id}
              position={[
                MAP_HEIGHT - restroom.map_y,
                restroom.map_x,
              ]}
              icon={createRestroomIcon(restroom.status)}
            >
              <Popup>
                <RestroomDetails
                  restroom={restroom}
                  isCustodian={isCustodian}
                  onStatusChange={handleStatusChange}
                  updating={updatingRestroomId === restroom.id}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>

      <section className="map-footer">
        <p className="restroom-count">
        {loading
          ? "Cargando disponibilidad..."
          : genderFilter
            ? `${visibleRestrooms.length} baños disponibles para ${genderFilter.toLowerCase()}`
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