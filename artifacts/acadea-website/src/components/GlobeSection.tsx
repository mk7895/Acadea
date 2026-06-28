import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  geoOrthographic,
  geoPath,
  geoGraticule,
  type GeoPermissibleObjects,
} from "d3-geo";
import { feature } from "topojson-client";
import topologyJson from "world-atlas/countries-110m.json";
import { Link, useLocation } from "wouter";
import { countryByIso } from "@/data/countries";

type CountryFeature = {
  id?: string | number;
  type: string;
  geometry: unknown;
  properties: Record<string, unknown>;
};

/** ISO 3166-1 numeric codes → country info */
const ACADEA = countryByIso;

type Rotation = [number, number, number];

const SIZE = 480;
const SCALE = SIZE / 2 - 16;
const INITIAL_ROT: Rotation = [-10, -50, 0];

// Handle world-atlas topology correctly
const getCountries = (): { features: CountryFeature[] } => {
  const topo = topologyJson as Record<string, unknown>;
  const objects = topo.objects as Record<string, unknown>;
  if (!objects) return { features: [] };
  return feature(topo, objects.countries) as { features: CountryFeature[] };
};

const COUNTRIES_GEO = getCountries();
const COUNTRIES_GEO_IDS = new Set(
  COUNTRIES_GEO.features.map((feature) => String(feature.id ?? "").padStart(3, "0")),
);
const GRATICULE = geoGraticule()();
const MANUAL_MARKERS: Record<string, { coordinates: [number, number]; radius: number }> = {
  "344": { coordinates: [114.1694, 22.3193], radius: 4.5 },
  "470": { coordinates: [14.3754, 35.9375], radius: 4.5 },
  "702": { coordinates: [103.8198, 1.3521], radius: 4.5 },
};

const toRadians = (value: number) => (value * Math.PI) / 180;

function isFrontHemisphere(
  coordinates: [number, number],
  rotation: Rotation,
) {
  const [lon, lat] = coordinates;
  const centerLon = -rotation[0];
  const centerLat = -rotation[1];

  const lonRad = toRadians(lon);
  const latRad = toRadians(lat);
  const centerLonRad = toRadians(centerLon);
  const centerLatRad = toRadians(centerLat);

  const dot =
    Math.sin(latRad) * Math.sin(centerLatRad) +
    Math.cos(latRad) *
      Math.cos(centerLatRad) *
      Math.cos(lonRad - centerLonRad);

  return dot > 0;
}

export function GlobeSection() {
  const [rotation, setRotation] = useState<Rotation>(INITIAL_ROT);
  const [hovered, setHovered] = useState<string | null>(null);

  const rotRef = useRef<Rotation>(INITIAL_ROT);
  const velocityRef = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const dragStart = useRef<{ x: number; y: number; rot: Rotation }>({ x: 0, y: 0, rot: INITIAL_ROT });
  const lastPointer = useRef<{ x: number; y: number; time: number } | null>(null);
  const animRef = useRef<number | null>(null);
  const clearTimer = useRef<number | null>(null);
  const [, navigate] = useLocation();

  const cancelClear = useCallback(() => {
    if (clearTimer.current) { clearTimeout(clearTimer.current); clearTimer.current = null; }
  }, []);
  const scheduleClear = useCallback(() => {
    cancelClear();
    clearTimer.current = window.setTimeout(() => setHovered(null), 160);
  }, [cancelClear]);

  useEffect(() => { rotRef.current = rotation; }, [rotation]);

  // Clear any pending hover-card timer on unmount
  useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);

  // Auto-rotate
  useEffect(() => {
    let lastT = 0;
    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop);
      if (dragging.current) { lastT = t; return; }
      if (t - lastT < 30) return;
      lastT = t;
      if (Math.abs(velocityRef.current.x) > 0.02 || Math.abs(velocityRef.current.y) > 0.02) {
        setRotation((r) => [
          r[0] + velocityRef.current.x,
          Math.max(-85, Math.min(85, r[1] + velocityRef.current.y)),
          r[2],
        ]);
        velocityRef.current.x *= 0.94;
        velocityRef.current.y *= 0.94;
        return;
      }
      velocityRef.current.x = 0;
      velocityRef.current.y = 0;
      setRotation(r => [r[0] + 0.12, r[1], r[2]]);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Global drag listeners
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const cx = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const cy = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dx = cx - dragStart.current.x;
      const dy = cy - dragStart.current.y;
      const now = performance.now();
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;
      const { rot } = dragStart.current;
      if (lastPointer.current) {
        const dt = Math.max(now - lastPointer.current.time, 16);
        velocityRef.current = {
          x: ((cx - lastPointer.current.x) * 0.4 * 16) / dt,
          y: ((lastPointer.current.y - cy) * 0.4 * 16) / dt,
        };
      }
      lastPointer.current = { x: cx, y: cy, time: now };
      setRotation([
        rot[0] + dx * 0.4,
        Math.max(-85, Math.min(85, rot[1] - dy * 0.4)),
        0,
      ]);
    };
    const onUp = () => {
      dragging.current = false;
      lastPointer.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    didDrag.current = false;
    const cx = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    velocityRef.current = { x: 0, y: 0 };
    lastPointer.current = { x: cx, y: cy, time: performance.now() };
    dragStart.current = { x: cx, y: cy, rot: rotRef.current };
  }, []);

  const projection = useMemo(
    () => geoOrthographic().scale(SCALE).translate([SIZE / 2, SIZE / 2]).clipAngle(90).rotate(rotation),
    [rotation],
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);
  const fallbackMarkers = useMemo(
    () =>
      Object.entries(ACADEA)
        .filter(([iso]) => !COUNTRIES_GEO_IDS.has(iso) && MANUAL_MARKERS[iso])
        .map(([iso, country]) => ({
          iso,
          country,
          ...MANUAL_MARKERS[iso],
        })),
    [],
  );

  const hoveredData = hovered ? ACADEA[hovered] : null;

  return (
    <div className="relative select-none w-full max-w-[500px] mx-auto pb-8">
      <div
        className="absolute left-1/2 top-[calc(100%-0.6rem)] h-10 w-[70%] -translate-x-1/2 rounded-full pointer-events-none blur-xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(22,101,52,0.22) 0%, rgba(22,101,52,0.12) 44%, rgba(22,101,52,0.03) 68%, rgba(22,101,52,0) 84%)",
        }}
      />
      <div className="absolute left-1/2 top-[calc(100%-0.15rem)] h-4 w-[38%] -translate-x-1/2 rounded-full bg-primary/15 pointer-events-none blur-md" />
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto cursor-grab active:cursor-grabbing rounded-full shadow-2xl"
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        style={{ touchAction: "none" }}
        aria-label="Interaktywna mapa ACADEA"
      >
        {/* Ocean */}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SCALE} fill="#e5f2ec" />

        {/* Graticule */}
        <path
          d={pathGen(GRATICULE as GeoPermissibleObjects) ?? ""}
          fill="none"
          stroke="#c3ddd4"
          strokeWidth={0.4}
        />

        {/* Countries */}
        {COUNTRIES_GEO.features.map((f: CountryFeature, index) => {
          const id = String(f.id ?? "");
          const isAcadea = !!ACADEA[id] || !!ACADEA[id.padStart(3, "0")];
          const resolvedId = ACADEA[id] ? id : id.padStart(3, "0");
          const isHov = hovered === resolvedId;

          // France (250): strip overseas territories in South America / Caribbean
          // by filtering out MultiPolygon rings whose first coordinate is west of -20°
          let effectiveFeature: CountryFeature = f;
          if (id === "250" || resolvedId === "250") {
            const geo = f.geometry as { type: string; coordinates: number[][][][] };
            if (geo.type === "MultiPolygon") {
              const europeOnly = geo.coordinates.filter((poly: number[][][]) => {
                const lon = poly[0]?.[0]?.[0] as number | undefined;
                return lon !== undefined && lon > -10;
              });
              effectiveFeature = { ...f, geometry: { ...geo, coordinates: europeOnly } } as CountryFeature;
            }
          }

          const d = pathGen(effectiveFeature as GeoPermissibleObjects);
          if (!d) return null;
          return (
            <path
              key={id || index}
              d={d}
              fill={isHov ? "#FCBC1E" : isAcadea ? "#166534" : "#c8d8e8"}
              stroke="#fff"
              strokeWidth={isAcadea ? 0.7 : 0.3}
              opacity={isAcadea ? 0.92 : 0.6}
              style={{ transition: "fill 0.12s ease", cursor: isAcadea ? "pointer" : "grab" }}
              onMouseEnter={() => { if (isAcadea) { cancelClear(); setHovered(resolvedId); } }}
              onMouseLeave={() => isAcadea && scheduleClear()}
              onClick={() => {
                if (!isAcadea || didDrag.current) return;
                const c = ACADEA[resolvedId];
                if (c) navigate(`/kraje/${c.slug}`);
              }}
            />
          );
        })}

        {fallbackMarkers.map((marker) => {
          if (!isFrontHemisphere(marker.coordinates, rotation)) return null;

          const point = projection(marker.coordinates);
          if (!point) return null;

          const isHovered = hovered === marker.iso;
          return (
            <circle
              key={marker.iso}
              cx={point[0]}
              cy={point[1]}
              r={marker.radius}
              fill={isHovered ? "#FCBC1E" : "#166534"}
              stroke="#ffffff"
              strokeWidth={1.5}
              style={{ cursor: "pointer", transition: "fill 0.12s ease" }}
              onMouseEnter={() => {
                cancelClear();
                setHovered(marker.iso);
              }}
              onMouseLeave={scheduleClear}
              onClick={() => {
                if (didDrag.current) return;
                navigate(`/kraje/${marker.country.slug}`);
              }}
            />
          );
        })}

        {/* Globe rim */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SCALE}
          fill="none"
          stroke="rgba(22,101,52,0.2)"
          strokeWidth={2}
        />
      </svg>

      {/* Country hover card */}
      {hoveredData && (
        <div
          className="absolute top-5 left-5 bg-white/96 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[230px] z-20"
          onMouseEnter={cancelClear}
          onMouseLeave={scheduleClear}
        >
          <Link
            href={`/kraje/${hoveredData.slug}`}
            className="flex items-center gap-2.5 mb-3 group"
          >
            <span className="text-2xl leading-none">{hoveredData.flag}</span>
            <h3 className="font-bold text-primary text-sm leading-tight group-hover:text-accent transition-colors">{hoveredData.name}</h3>
          </Link>
          <ul className="space-y-0.5">
            {hoveredData.unis.map((uni) => (
              <li key={uni.slug}>
                <Link
                  href={`/kraje/${hoveredData.slug}#${uni.slug}`}
                  className="text-xs text-gray-600 flex items-start gap-2 rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block shrink-0 mt-1.5" />
                  {uni.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/kraje/${hoveredData.slug}`}
            className="mt-2.5 inline-block text-xs font-semibold text-accent hover:text-primary transition-colors"
          >
            Zobacz kraj →
          </Link>
        </div>
      )}

    </div>
  );
}
