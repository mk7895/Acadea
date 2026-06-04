import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { geoOrthographic, geoPath, geoGraticule, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import topologyJson from "world-atlas/countries-110m.json";

type CountryFeature = {
  id?: string | number;
  type: string;
  geometry: unknown;
  properties: Record<string, unknown>;
};

type CountryData = { name: string; flag: string; unis: string[] };

/** ISO 3166-1 numeric codes → country info */
const ACADEA: Record<string, CountryData> = {
  "826": { name: "Wielka Brytania", flag: "🇬🇧", unis: ["University of Oxford", "Imperial College London", "London School of Economics", "UCL"] },
  "528": { name: "Holandia", flag: "🇳🇱", unis: ["TU Delft", "Universiteit Leiden", "Universiteit van Amsterdam", "Utrecht University"] },
  "276": { name: "Niemcy", flag: "🇩🇪", unis: ["TU Munich", "Humboldt Universität Berlin", "Universität Heidelberg", "KIT Karlsruhe"] },
  "372": { name: "Irlandia", flag: "🇮🇪", unis: ["University College Dublin", "Trinity College Dublin", "University College Cork"] },
  "250": { name: "Francja", flag: "🇫🇷", unis: ["Sciences Po", "HEC Paris", "Université PSL", "École Polytechnique"] },
  "756": { name: "Szwajcaria", flag: "🇨🇭", unis: ["ETH Zürich", "EPFL Lausanne", "Universität Zürich", "Universität Basel"] },
  "752": { name: "Szwecja", flag: "🇸🇪", unis: ["KTH Royal Institute of Technology", "Lund University", "Uppsala University"] },
  "208": { name: "Dania", flag: "🇩🇰", unis: ["Technical Univ. of Denmark", "Univ. of Copenhagen", "Aarhus University"] },
  "724": { name: "Hiszpania", flag: "🇪🇸", unis: ["IE University", "Univ. Complutense de Madrid", "Universitat de Barcelona"] },
  "380": { name: "Włochy", flag: "🇮🇹", unis: ["Università di Bologna", "Politecnico di Milano", "Università La Sapienza"] },
  "40":  { name: "Austria", flag: "🇦🇹", unis: ["Universität Wien", "TU Wien", "Wirtschaftsuniversität Wien"] },
  "56":  { name: "Belgia", flag: "🇧🇪", unis: ["KU Leuven", "Université Libre de Bruxelles", "Ghent University"] },
  "578": { name: "Norwegia", flag: "🇳🇴", unis: ["University of Oslo", "NTNU Trondheim", "BI Norwegian Business School"] },
  "203": { name: "Czechy", flag: "🇨🇿", unis: ["Charles University Prague", "Czech Technical University"] },
  "620": { name: "Portugalia", flag: "🇵🇹", unis: ["Universidade de Lisboa", "Universidade do Porto", "Nova University Lisbon"] },
  "246": { name: "Finlandia", flag: "🇫🇮", unis: ["Aalto University", "University of Helsinki", "Tampere University"] },
  "124": { name: "Kanada", flag: "🇨🇦", unis: ["University of Toronto", "McGill University", "UBC Vancouver", "University of Waterloo"] },
  "840": { name: "USA", flag: "🇺🇸", unis: ["MIT", "Harvard University", "Stanford University", "Columbia University", "NYU"] },
  "156": { name: "Chiny", flag: "🇨🇳", unis: ["Peking University", "Tsinghua University", "Fudan University", "Zhejiang University"] },
  "410": { name: "Korea Południowa", flag: "🇰🇷", unis: ["Seoul National University", "KAIST", "Yonsei University", "POSTECH"] },
  "702": { name: "Singapur", flag: "🇸🇬", unis: ["National University of Singapore", "Nanyang Technological University", "SMU"] },
  "392": { name: "Japonia", flag: "🇯🇵", unis: ["University of Tokyo", "Kyoto University", "Waseda University", "Osaka University"] },
  "36":  { name: "Australia", flag: "🇦🇺", unis: ["University of Melbourne", "University of Sydney", "ANU", "UNSW Sydney"] },
  "470": { name: "Malta", flag: "🇲🇹", unis: ["University of Malta", "MCAST", "Malta Business School"] },
  "784": { name: "ZEA", flag: "🇦🇪", unis: ["NYU Abu Dhabi", "Khalifa University", "American University of Sharjah"] },
  "344": { name: "Hongkong", flag: "🇭🇰", unis: ["HKU", "HKUST", "Chinese University of Hong Kong", "City University of Hong Kong"] },
};

type Rotation = [number, number, number];

const SIZE = 480;
const SCALE = SIZE / 2 - 16;
const INITIAL_ROT: Rotation = [-10, -50, 0];

const countriesGeo = feature(topologyJson, (topologyJson as Record<string, unknown>).objects
  ? (topologyJson as Record<string, { type: string }>).objects
  // @ts-expect-error world-atlas shape
  : topologyJson.objects.countries) as { features: CountryFeature[] };

// Handle world-atlas topology correctly
const getCountries = (): { features: CountryFeature[] } => {
  const topo = topologyJson as Record<string, unknown>;
  const objects = topo.objects as Record<string, unknown>;
  if (!objects) return { features: [] };
  return feature(topo, objects.countries) as { features: CountryFeature[] };
};

const COUNTRIES_GEO = getCountries();
const GRATICULE = geoGraticule()();

export function GlobeSection() {
  const [rotation, setRotation] = useState<Rotation>(INITIAL_ROT);
  const [hovered, setHovered] = useState<string | null>(null);

  const rotRef = useRef<Rotation>(INITIAL_ROT);
  const dragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number; rot: Rotation }>({ x: 0, y: 0, rot: INITIAL_ROT });
  const animRef = useRef<number | null>(null);

  useEffect(() => { rotRef.current = rotation; }, [rotation]);

  // Auto-rotate
  useEffect(() => {
    let lastT = 0;
    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop);
      if (dragging.current) { lastT = t; return; }
      if (t - lastT < 30) return;
      lastT = t;
      setRotation(r => [r[0] + 0.18, r[1], r[2]]);
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
      const { rot } = dragStart.current;
      setRotation([
        rot[0] + dx * 0.4,
        Math.max(-85, Math.min(85, rot[1] - dy * 0.4)),
        0,
      ]);
    };
    const onUp = () => { dragging.current = false; };
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
    const cx = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = { x: cx, y: cy, rot: rotRef.current };
  }, []);

  const projection = useMemo(
    () => geoOrthographic().scale(SCALE).translate([SIZE / 2, SIZE / 2]).clipAngle(90).rotate(rotation),
    [rotation],
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const hoveredData = hovered ? ACADEA[hovered] : null;

  return (
    <div className="relative select-none w-full max-w-[500px] mx-auto">
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
        {COUNTRIES_GEO.features.map((f: CountryFeature) => {
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
              key={id || Math.random()}
              d={d}
              fill={isHov ? "#FCBC1E" : isAcadea ? "#166534" : "#c8d8e8"}
              stroke="#fff"
              strokeWidth={isAcadea ? 0.7 : 0.3}
              opacity={isAcadea ? 0.92 : 0.6}
              style={{ transition: "fill 0.12s ease" }}
              onMouseEnter={() => isAcadea && setHovered(resolvedId)}
              onMouseLeave={() => setHovered(null)}
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
        <div className="absolute top-5 left-5 bg-white/96 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[220px] z-20 pointer-events-none">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-2xl leading-none">{hoveredData.flag}</span>
            <h3 className="font-bold text-primary text-sm leading-tight">{hoveredData.name}</h3>
          </div>
          <ul className="space-y-1.5">
            {hoveredData.unis.map((uni, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block shrink-0 mt-1" />
                {uni}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-2 bg-white/90 rounded-xl px-3 py-2 flex items-center gap-3 text-xs text-gray-400 pointer-events-none shadow border border-gray-100">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#166534] inline-block shrink-0" />
          Współpracujemy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#FCBC1E] inline-block shrink-0" />
          Wybrany
        </span>
      </div>
    </div>
  );
}
