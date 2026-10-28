import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ThreeDVisualizationModal from "../components/ThreeDVisualizationModal";
import { generateAllConcepts } from "../utils/spatialLayoutGenerator";
import { generateUpperFloorConcept } from "../utils/upperFloorPlanner";

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number % 1 === 0 ? String(number) : number.toFixed(1);
}

function getPlot(requirements = {}) {
  const rawWidth = Number(requirements?.plotWidth);
  const rawLength = Number(requirements?.plotLength);
  const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : 30;
  const length = Number.isFinite(rawLength) && rawLength > 0 ? rawLength : 40;

  return {
    width,
    length,
    area: width * length,
  };
}

function getDefaultUpperExtras(requirements) {
  const preferences = requirements?.preferences || {};
  const text = [
    preferences.specialRequirements,
    preferences.priorities,
    preferences.lifestyle,
    preferences.comfort,
    preferences.relationships,
    preferences.separations,
    preferences.customRequirements,
  ]
    .flat(Infinity)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const extras = [];
  if (text.includes("guest")) extras.push("guest");
  else if (text.includes("elder")) extras.push("elder");
  if (text.includes("study") || text.includes("work from home")) extras.push("study");
  if (text.includes("laundry")) extras.push("utility");
  if (text.includes("storage")) extras.push("storage");
  if (text.includes("children's play") || text.includes("play area")) extras.push("play");
  return extras;
}

const UPPER_OPTIONAL_SPACES = [
  { id: "study", label: "Study / Home Office" },
  { id: "storage", label: "Extra Storage" },
  { id: "utility", label: "Laundry / Utility" },
  { id: "guest", label: "Guest Bedroom" },
  { id: "elder", label: "Elder-Friendly Bedroom" },
  { id: "play", label: "Children's Activity Room" },
];

function MultiFloorPlanningPanel({ requirements, concept, aiAnalysis }) {
  const [secondFloorEnabled, setSecondFloorEnabled] = useState(false);
  const [bedrooms, setBedrooms] = useState(
    Math.max(1, Math.min(4, Number(requirements?.bedrooms) || 1))
  );
  const [bathrooms, setBathrooms] = useState(
    Math.max(1, Math.min(3, Number(requirements?.bathrooms) || 1))
  );
  const [selectedExtras, setSelectedExtras] = useState(() =>
    getDefaultUpperExtras(requirements)
  );
  const [balconySelected, setBalconySelected] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(
    concept?.strategy || concept?.id || "family"
  );
  const [show3D, setShow3D] = useState(false);

  const generatedSecondFloor = useMemo(() => {
    if (!secondFloorEnabled) return null;

    try {
      return generateUpperFloorConcept(
        requirements,
        aiAnalysis,
        concept,
        {
          bedrooms,
          bathrooms,
          strategy: selectedStrategy,
          extraSpaces: selectedExtras,
          balcony: balconySelected,
        }
      );
    } catch (error) {
      console.error(
        "MyNest customized second-floor generation failed:",
        error
      );

      return {
        id: `upper-${selectedStrategy}`,
        title: "Customized 2nd Floor",
        rooms: [],
        validation: {
          valid: false,
          errors: [error.message],
        },
      };
    }
  }, [
    secondFloorEnabled,
    requirements,
    aiAnalysis,
    concept,
    bedrooms,
    bathrooms,
    selectedStrategy,
    selectedExtras,
    balconySelected,
  ]);

  const secondFloorPlot = useMemo(
    () => getPlot(requirements),
    [requirements]
  );

  const updateCount = (
    setter,
    value,
    min,
    max
  ) => {
    setter(
      Math.max(
        min,
        Math.min(max, Number(value))
      )
    );
    setShow3D(false);
  };

  const rooms =
    generatedSecondFloor?.rooms || [];

  const bedroomCount = rooms.filter(
    (room) =>
      room.type === "bedroom"
  ).length;

  const bathroomCount = rooms.filter(
    (room) =>
      room.type === "bathroom"
  ).length;

  const validationErrors =
    generatedSecondFloor?.validation
      ?.errors || [];

  const planningWarnings =
    generatedSecondFloor?.warnings || [];

  const groundFloorBedroomCount =
    (concept?.rooms || []).filter(
      (room) =>
        room.type === "bedroom"
    ).length;

  const groundFloorBathroomCount =
    (concept?.rooms || []).filter(
      (room) =>
        room.type === "bathroom"
    ).length;

  return (
    <section className="mt-8 border border-[#E4E1D8] bg-white p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
            Upper-floor customization
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Customize the 2nd floor independently
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#73766F]">
            The ground-floor concept above is treated as
            fixed. These controls generate a separate second-floor
            planning program without regenerating, moving or
            resizing any ground-floor room.
          </p>
        </div>

        <div className="border border-[#71806B]/30 bg-[#F3F6F1] px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#53604F]">
            Ground floor protected
          </p>
          <p className="mt-1 text-xs text-[#73766F]">
            {groundFloorBedroomCount} bedrooms ·{" "}
            {groundFloorBathroomCount} bathrooms
          </p>
        </div>
      </div>

      <div className="mt-6 border border-[#E4E1D8] bg-[#F7F5EF] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Add a 2nd floor
            </p>
            <p className="mt-1 text-xs leading-5 text-[#73766F]">
              Start with a dedicated upper-floor program.
              Your existing ground-floor geometry remains untouched.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSecondFloorEnabled(
                (current) => !current
              );
              setShow3D(false);
            }}
            className={`inline-flex min-w-[150px] items-center justify-center gap-2 border px-5 py-3 text-sm font-semibold transition ${
              secondFloorEnabled
                ? "border-[#53604F] bg-[#53604F] text-white"
                : "border-[#53604F] bg-white text-[#53604F] hover:bg-[#F3F6F1]"
            }`}
            aria-label={
              secondFloorEnabled
                ? "Remove second floor"
                : "Add second floor"
            }
          >
            <span className="text-lg leading-none">
              {secondFloorEnabled ? "✓" : "+"}
            </span>
            <span>
              {secondFloorEnabled
                ? "2nd Floor Added"
                : "Add 2nd Floor"}
            </span>
          </button>
        </div>
      </div>

      {secondFloorEnabled && (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="border border-[#E4E1D8] p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73766F]">
                Bedrooms
              </p>

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    updateCount(
                      setBedrooms,
                      bedrooms - 1,
                      1,
                      4
                    )
                  }
                  className="h-9 w-9 border border-[#D8D5CC] bg-white text-lg"
                >
                  −
                </button>

                <span className="text-xl font-semibold">
                  {bedrooms}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateCount(
                      setBedrooms,
                      bedrooms + 1,
                      1,
                      4
                    )
                  }
                  className="h-9 w-9 border border-[#D8D5CC] bg-white text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="border border-[#E4E1D8] p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73766F]">
                Bathrooms
              </p>

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    updateCount(
                      setBathrooms,
                      bathrooms - 1,
                      1,
                      3
                    )
                  }
                  className="h-9 w-9 border border-[#D8D5CC] bg-white text-lg"
                >
                  −
                </button>

                <span className="text-xl font-semibold">
                  {bathrooms}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateCount(
                      setBathrooms,
                      bathrooms + 1,
                      1,
                      3
                    )
                  }
                  className="h-9 w-9 border border-[#D8D5CC] bg-white text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="border border-[#E4E1D8] p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73766F]">
                Planning strategy
              </p>

              <select
                value={selectedStrategy}
                onChange={(event) => {
                  setSelectedStrategy(
                    event.target.value
                  );
                  setShow3D(false);
                }}
                className="mt-3 w-full border border-[#D8D5CC] bg-white px-3 py-2 text-sm outline-none focus:border-[#71806B]"
              >
                <option value="family">
                  Family Friendly
                </option>
                <option value="private">
                  Privacy First
                </option>
                <option value="spacious">
                  Spacious & Open
                </option>
              </select>
            </div>
          </div>

          <div className="mt-5 border border-[#E4E1D8] bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B86F52]">
                  Optional upper-floor spaces
                </p>
                <p className="mt-1 text-xs leading-5 text-[#73766F]">
                  Select only the extra spaces you want. Required bedrooms and bathrooms remain separate from these choices.
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71806B]">
                {selectedExtras.length + (balconySelected ? 1 : 0)} selected
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {UPPER_OPTIONAL_SPACES.map((option) => {
                const checked = selectedExtras.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 border px-3 py-3 text-xs ${
                      checked ? "border-[#71806B] bg-[#F3F6F1]" : "border-[#E4E1D8] bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedExtras((current) =>
                          checked
                            ? current.filter((item) => item !== option.id)
                            : [...current, option.id]
                        );
                        setShow3D(false);
                      }}
                      className="h-4 w-4 accent-[#53604F]"
                    />
                    <span className="font-medium">{option.label}</span>
                  </label>
                );
              })}

              <label
                className={`flex cursor-pointer items-center gap-3 border px-3 py-3 text-xs ${
                  balconySelected ? "border-[#71806B] bg-[#F3F6F1]" : "border-[#E4E1D8] bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={balconySelected}
                  onChange={() => {
                    setBalconySelected((current) => !current);
                    setShow3D(false);
                  }}
                  className="h-4 w-4 accent-[#53604F]"
                />
                <span className="font-medium">Balcony / Outdoor Space</span>
              </label>
            </div>
          </div>

          <div className="mt-5 border border-[#D8DDD3] bg-[#EEF1EA] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#53604F]">
              2nd-floor planning rule
            </p>

            <p className="mt-2 text-xs leading-5 text-[#73766F]">
              The upper floor is generated from its own room
              program and the same plot dimensions. The selected
              ground-floor concept is used only to carry forward
              the planning strategy; its room geometry is never
              passed back for modification.
            </p>
          </div>

          {generatedSecondFloor && (
            <div className="mt-5 border border-[#E4E1D8] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#71806B]">
                    2nd floor generated plan
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">
                    {generatedSecondFloor.title}
                  </h3>

                  <p className="mt-1 text-xs text-[#73766F]">
                    {bedroomCount} bedrooms ·{" "}
                    {bathroomCount} bathrooms ·{" "}
                    {formatNumber(
                      generatedSecondFloor
                        .planningMetrics
                        ?.builtArea
                    )}{" "}
                    sq.ft built area
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setShow3D(false)
                    }
                    className={`border px-4 py-2 text-xs font-semibold ${
                      !show3D
                        ? "border-[#53604F] bg-[#53604F] text-white"
                        : "border-[#D8D5CC] bg-white text-[#53604F]"
                    }`}
                  >
                    2D Floor Plan
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShow3D(true)
                    }
                    className={`border px-4 py-2 text-xs font-semibold ${
                      show3D
                        ? "border-[#53604F] bg-[#53604F] text-white"
                        : "border-[#D8D5CC] bg-white text-[#53604F]"
                    }`}
                  >
                    3D Preview
                  </button>
                </div>
              </div>

              {!show3D && (
                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
                  <div className="border border-[#E4E1D8] bg-[#F7F5EF] p-3">
                    <MiniPlan
                      concept={
                        generatedSecondFloor
                      }
                      plot={
                        secondFloorPlot
                      }
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#B86F52]">
                      2nd-floor spaces
                    </p>

                    <div className="mt-3 space-y-2">
                      {rooms.map(
                        (room) => (
                          <div
                            key={
                              room.id
                            }
                            className="flex items-center justify-between border border-[#E4E1D8] bg-[#F7F5EF] px-3 py-2 text-xs"
                          >
                            <span>
                              {room.name}
                            </span>

                            <span className="text-[#73766F]">
                              {formatNumber(
                                room.width
                              )}{" "}
                              ×{" "}
                              {formatNumber(
                                room.length
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-4 border border-[#71806B]/30 bg-[#71806B]/10 p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#53604F]">
                        Independent from ground floor
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#73766F]">
                        Changes above regenerate only this
                        second-floor concept.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="mt-5 border border-[#B86F52]/30 bg-[#FBEEE7] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B86F52]">
                    2nd-floor validation
                  </p>

                  <ul className="mt-2 space-y-1">
                    {validationErrors.map(
                      (error, index) => (
                        <li
                          key={index}
                          className="text-xs leading-5 text-[#73766F]"
                        >
                          • {error}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {planningWarnings.length > 0 && (
                <div className="mt-5 border border-[#D8D5CC] bg-[#F7F5EF] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71806B]">
                    Planning notes
                  </p>
                  <ul className="mt-2 space-y-1">
                    {planningWarnings.map((warning, index) => (
                      <li key={index} className="text-xs leading-5 text-[#73766F]">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {show3D && (
                <div className="mt-5">
                  <ThreeDVisualizationModal
                    concept={generatedSecondFloor}
                    plot={secondFloorPlot}
                    floors={[
                      {
                        id: "ground-floor",
                        label: "Ground Floor",
                        concept,
                      },
                      {
                        id: "second-floor",
                        label: "2nd Floor",
                        concept: generatedSecondFloor,
                      },
                    ]}
                    onClose={() =>
                      setShow3D(false)
                    }
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function roomFill(type) {
  if (type === "bedroom") return "#E9E0D1";
  if (type === "kitchen") return "#E6DED0";
  if (type === "bathroom") return "#DCE7E4";
  if (type === "pooja") return "#EFE4CC";
  if (type === "dining") return "#EEE9DE";
  if (type === "living") return "#E8E4DA";
  return "#EEECE5";
}

function miniRect(room, plot) {
  return {
    x: room.x,
    y: plot.length - room.y - room.length,
    w: room.width,
    h: room.length,
  };
}

function MiniFurniture({ item, plot }) {
  const y = plot.length - item.y - item.length;

  if (item.type === "bed") {
    return (
      <g>
        <rect x={item.x} y={y} width={item.width} height={item.length} rx="0.35" fill="#B8A58E" stroke="#6F6254" strokeWidth="0.18" />
        <rect x={item.x + 0.35} y={y + 0.35} width={Math.max(0.1, item.width - 0.7)} height={Math.min(1.4, item.length * 0.22)} rx="0.2" fill="#F7F3EA" />
        <line x1={item.x + 0.35} y1={y + item.length * 0.42} x2={item.x + item.width - 0.35} y2={y + item.length * 0.42} stroke="#8C7B68" strokeWidth="0.12" />
      </g>
    );
  }

  if (item.type === "wardrobe") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} fill="#9C8268" stroke="#5F4D3C" strokeWidth="0.18" />;
  }

  if (item.type === "sofa") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} rx="0.45" fill="#A99988" stroke="#675C51" strokeWidth="0.18" />;
  }

  if (item.type === "coffee-table") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} rx="0.35" fill="#C8B69E" stroke="#806D59" strokeWidth="0.16" />;
  }

  if (item.type === "tv-unit") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} fill="#4E504B" />;
  }

  if (item.type === "dining-table") {
    return (
      <g>
        <rect x={item.x} y={y} width={item.width} height={item.length} rx="0.3" fill="#8E6C4D" stroke="#624A37" strokeWidth="0.16" />
        {[0.18, 0.5, 0.82].map((p) => (
          <g key={p}>
            <rect x={item.x + item.width * p - 0.45} y={y - 0.65} width="0.9" height="0.5" rx="0.15" fill="#765E49" />
            <rect x={item.x + item.width * p - 0.45} y={y + item.length + 0.15} width="0.9" height="0.5" rx="0.15" fill="#765E49" />
          </g>
        ))}
      </g>
    );
  }

  if (item.type === "counter") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} fill="#817A70" stroke="#55534E" strokeWidth="0.14" />;
  }

  if (item.type === "stove") {
    return (
      <g>
        <rect x={item.x} y={y} width={item.width} height={item.length} fill="#A9A6A0" />
        <circle cx={item.x + item.width * 0.35} cy={y + item.length * 0.5} r="0.32" fill="#4F504C" />
        <circle cx={item.x + item.width * 0.7} cy={y + item.length * 0.5} r="0.32" fill="#4F504C" />
      </g>
    );
  }

  if (item.type === "sink") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} rx="0.18" fill="#C8D6D3" stroke="#63736F" strokeWidth="0.15" />;
  }

  if (item.type === "refrigerator") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} fill="#B8B8B3" stroke="#62635F" strokeWidth="0.16" />;
  }

  if (item.type === "basin") {
    return <ellipse cx={item.x + item.width / 2} cy={y + item.length / 2} rx={item.width / 2} ry={item.length / 2} fill="#F6F5F0" stroke="#6B7773" strokeWidth="0.15" />;
  }

  if (item.type === "shower") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} fill="#C9DAD6" stroke="#687A75" strokeWidth="0.15" strokeDasharray="0.4 0.25" />;
  }

  if (item.type === "wc") {
    return <ellipse cx={item.x + item.width / 2} cy={y + item.length / 2} rx={item.width / 2} ry={item.length / 2} fill="#F7F6F1" stroke="#6B7773" strokeWidth="0.15" />;
  }

  if (item.type === "altar") {
    return <rect x={item.x} y={y} width={item.width} height={item.length} fill="#9C7752" stroke="#634A36" strokeWidth="0.15" />;
  }

  return null;
}

function MiniDoor({ room, plot }) {
  const r = miniRect(room, plot);
  const door = Math.min(3.4, Math.max(2.5, Math.min(r.w, r.h) * 0.24));
  const x = r.x + r.w * 0.48;
  const y = r.y + r.h;

  return (
    <g pointerEvents="none">
      <line x1={x} y1={y} x2={x + door} y2={y} stroke="#F4F0E7" strokeWidth="0.65" />
      <path d={`M ${x} ${y} A ${door} ${door} 0 0 1 ${x + door} ${y - door}`} fill="none" stroke="#4A4C47" strokeWidth="0.12" />
    </g>
  );
}

function MiniWindows({ room, plot }) {
  const r = miniRect(room, plot);
  return (
    <g pointerEvents="none">
      <line x1={r.x + r.w * 0.2} y1={r.y} x2={r.x + r.w * 0.52} y2={r.y} stroke="#6F969E" strokeWidth="0.65" />
      <line x1={r.x + r.w} y1={r.y + r.h * 0.25} x2={r.x + r.w} y2={r.y + r.h * 0.58} stroke="#6F969E" strokeWidth="0.65" />
    </g>
  );
}

function MiniPlan({ concept, plot }) {
  if (!concept) return null;

  const pad = 2;
  const viewW = plot.width + pad * 2;
  const viewH = plot.length + pad * 2;

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden border border-[#BEBAB0] bg-[#DDE3D7]">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="h-full w-full">
        <defs>
          <filter id={`mini-shadow-${concept.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.22" dy="0.38" stdDeviation="0.3" floodOpacity="0.2" />
          </filter>
          <pattern id={`mini-floor-${concept.id}`} width="2" height="2" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#D6D2C8" strokeWidth="0.06" />
          </pattern>
        </defs>

        <rect width={viewW} height={viewH} fill="#DCE4D7" />
        <g transform={`translate(${pad} ${pad})`}>
          <rect x="0" y="0" width={plot.width} height={plot.length} fill="#EEECE4" filter={`url(#mini-shadow-${concept.id})`} />
          <rect x="0" y="0" width={plot.width} height={plot.length} fill={`url(#mini-floor-${concept.id})`} opacity="0.38" />

          {concept.outdoor?.map((item) => {
            if (item.type !== "balcony") return null;
            const y = plot.length - item.y - item.length;
            return (
              <g key={item.id}>
                <rect x={item.x} y={y} width={item.width} height={item.length} fill="#B8C9A9" stroke="#65725F" strokeWidth="0.25" />
                <text x={item.x + item.width / 2} y={y + item.length / 2} textAnchor="middle" dominantBaseline="middle" fontSize="0.75" fill="#56624F">BALCONY</text>
              </g>
            );
          })}

          {concept.rooms?.map((room) => {
            const r = miniRect(room, plot);
            return (
              <g key={room.id}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={roomFill(room.type)} stroke="#454842" strokeWidth="0.42" />
                <rect x={r.x + 0.35} y={r.y + 0.35} width={Math.max(0.1, r.w - 0.7)} height={Math.max(0.1, r.h - 0.7)} fill="none" stroke="#FFFFFF" strokeWidth="0.11" opacity="0.75" />
                {(room.furnitureLayout || []).map((item, index) => <MiniFurniture key={index} item={item} plot={plot} />)}
                <MiniWindows room={room} plot={plot} />
                <MiniDoor room={room} plot={plot} />
                <text x={r.x + r.w / 2} y={r.y + r.h * 0.52} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(0.48, Math.min(0.82, r.w / 17))} fontWeight="700" fill="#363934">
                  {room.name.length > 18 ? `${room.name.slice(0, 16)}…` : room.name}
                </text>
                <text x={r.x + r.w / 2} y={r.y + r.h * 0.62} textAnchor="middle" dominantBaseline="middle" fontSize="0.42" fill="#6C6E68">
                  {formatNumber(room.width)} × {formatNumber(room.length)} ft
                </text>
              </g>
            );
          })}

          <g transform={`translate(${plot.width - 2.8} 2.5)`} pointerEvents="none">
            <circle cx="0" cy="0" r="1.15" fill="#FFFFFF" stroke="#555951" strokeWidth="0.13" />
            <path d="M 0 -0.78 L 0.34 0.22 L 0 0.03 L -0.34 0.22 Z" fill="#555951" />
            <text x="0" y="1.9" textAnchor="middle" fontSize="0.65" fill="#555951">N</text>
          </g>
        </g>
      </svg>

      <div className="absolute bottom-1 right-1 bg-white/90 px-1 text-[5px] uppercase tracking-[0.08em] text-[#73766F]">
        Architectural concept
      </div>
    </div>
  );
}

function RulesPanel() {
  const rules = [
    ["Entrance", "North / East / Northeast"],
    ["Living", "East / North / Northeast"],
    ["Master", "Southwest"],
    ["Child room", "Northeast"],
    ["Kitchen + stove", "Southeast"],
    ["Pooja", "East / Northeast"],
    ["Water", "Northeast / North"],
    ["Balcony", "North / East / Northeast"],
    ["Bathroom fixtures", "East / North / Northeast"],
    ["Dining", "East / West / North"],
  ];

  return (
    <section className="mt-10 border border-[#E4E1D8] bg-white p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
        Vastu logic
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Rules used by the planning layer</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rules.map(([name, direction]) => (
          <div key={name} className="border border-[#E4E1D8] bg-[#F7F5EF] p-4">
            <p className="text-xs font-semibold">{name}</p>
            <p className="mt-2 text-xs leading-5 text-[#73766F]">{direction}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-[#73766F]">
        These are the user-supplied Vastu-oriented planning rules. They are applied as conceptual
        layout constraints and are not presented as scientific, structural, or construction validation.
      </p>
    </section>
  );
}

function ReasonPanel({ concept }) {
  if (!concept) return null;

  const assessment = concept.vastuAssessment || concept.vastu || {};
  const score = Number(assessment.score);
  const strengths = assessment.strengths || assessment.rulesApplied || [];
  const validationErrors = concept.validation?.errors || [];
  const compromises = assessment.compromises || [];
  const reviewItems = validationErrors.length > 0 ? validationErrors : compromises;
  const isValid = concept.validation?.valid === true;

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="border border-[#E4E1D8] bg-white p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
          Planning decisions
        </p>
        <h3 className="mt-2 text-xl font-semibold">Why spaces are placed this way</h3>
        <div className="mt-5 space-y-4">
          {(concept.rooms || []).map((room) => (
            <div key={room.id} className="border-b border-[#E4E1D8] pb-4 last:border-0">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold">{room.name}</p>
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#71806B]">
                  {room.vastuDirection || "Planned"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[#73766F]">
                {room.planningReason || "Placed according to the generated spatial program."}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[#E4E1D8] bg-white p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
          Validation
        </p>
        <h3 className="mt-2 text-xl font-semibold">
          {isValid ? "Layout passed spatial validation" : "Layout needs review"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#73766F]">
          {isValid
            ? "All current spatial checks passed for this conceptual layout."
            : "One or more spatial constraints need attention before this concept can be treated as validated."}
        </p>

        <div className={`mt-5 border px-4 py-3 ${isValid ? "border-[#71806B]/30 bg-[#71806B]/10" : "border-[#B86F52]/30 bg-[#FBEEE7]"}`}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#73766F]">
              Spatial validation
            </span>
            <span className={`text-xs font-semibold ${isValid ? "text-[#53604F]" : "text-[#B86F52]"}`}>
              {isValid ? "PASSED" : `${validationErrors.length} issue${validationErrors.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {Number.isFinite(score) && (
          <div className="mt-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#73766F]">Vastu alignment</span>
              <strong>{formatNumber(score)}/100</strong>
            </div>
            <div className="mt-2 h-2 bg-[#E4E1D8]">
              <div className="h-full bg-[#71806B]" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71806B]">Applied</p>
          <ul className="mt-3 space-y-2">
            {strengths.map((item, index) => (
              <li key={index} className="text-sm leading-5 text-[#73766F]">• {item}</li>
            ))}
          </ul>
        </div>

        {reviewItems.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B86F52]">
              {validationErrors.length > 0 ? "Validation issues" : "Planning review"}
            </p>
            <ul className="mt-3 space-y-2">
              {reviewItems.map((item, index) => (
                <li key={index} className="text-sm leading-5 text-[#73766F]">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default function FloorPlanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const requirements = location.state?.requirements || {};
  const aiAnalysis = location.state?.aiAnalysis || null;

  const generated = useMemo(() => {
    try {
      return generateAllConcepts(requirements, aiAnalysis);
    } catch (error) {
      console.error("MyNest spatial generation failed:", error);
      return { concepts: [], validation: { valid: false, errors: [error.message] } };
    }
  }, [requirements, aiAnalysis]);

  const concepts = Array.isArray(generated) ? generated : generated?.concepts || [];
  const plot = useMemo(() => getPlot(requirements), [requirements]);
  const [selectedId, setSelectedId] = useState("");
  const [show3D, setShow3D] = useState(false);

  const selectedConcept = concepts.find((item) => item.id === selectedId) || concepts[0] || null;

  const selectConcept = (id) => setSelectedId(id);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">
      <header className="border-b border-[#E4E1D8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center border border-[#71806B] text-sm font-semibold text-[#53604F]">N</div>
            <div>
              <div className="text-lg font-semibold tracking-tight">MyNest</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#73766F]">Intelligent Home Planning</div>
            </div>
          </button>
          <span className="text-xs uppercase tracking-[0.15em] text-[#73766F]">AI Spatial Planning</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#71806B]">Vastu-oriented architecture</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Your home, planned around your requirements.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#73766F]">
            MyNest generates multiple conceptual residential layouts while applying the supplied Vastu
            directions, room relationships, spatial validation and plot constraints.
          </p>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-4">
          {[
            ["Plot", `${plot.width} × ${plot.length} ft`],
            ["Plot area", `${plot.area.toLocaleString()} sq.ft`],
            ["Bedrooms", requirements.bedrooms || "—"],
            ["Bathrooms", requirements.bathrooms || "—"],
          ].map(([label, value]) => (
            <div key={label} className="border border-[#E4E1D8] bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#73766F]">{label}</p>
              <p className="mt-2 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        {concepts.length === 0 ? (
          <section className="border border-[#B86F52] bg-[#FBEEE7] p-6">
            <h2 className="text-xl font-semibold">No valid conceptual plan was generated.</h2>
            <p className="mt-2 text-sm leading-6 text-[#73766F]">
              The spatial planning engine could not create a layout for the current requirements.
            </p>
          </section>
        ) : (
          <>
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B86F52]">Generated plans</p>
                  <h2 className="mt-2 text-2xl font-semibold">Three Vastu-oriented planning strategies</h2>
                </div>
                <span className="text-xs text-[#73766F]">Select a plan to inspect it.</span>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {concepts.map((concept, index) => {
                  const selected = selectedConcept?.id === concept.id;
                  return (
                    <button
                      key={concept.id}
                      type="button"
                      onClick={() => selectConcept(concept.id)}
                      className={`border bg-white p-4 text-left transition ${selected ? "border-[#53604F] shadow-[0_12px_35px_rgba(32,36,33,0.10)]" : "border-[#E4E1D8] hover:border-[#71806B]"}`}
                    >
                      <MiniPlan concept={concept} plot={plot} />
                      <div className="px-1 pb-1 pt-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B86F52]">Concept {index + 1}</p>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <h3 className="text-xl font-semibold">{concept.title}</h3>
                          {selected && <span className="text-[9px] font-semibold uppercase text-[#53604F]">Selected</span>}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#73766F]">{concept.summary || concept.description}</p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="border border-[#E4E1D8] p-3">
                            <p className="text-[8px] uppercase tracking-[0.12em] text-[#73766F]">Built area</p>
                            <p className="mt-1 text-sm font-semibold">{formatNumber(concept.planningMetrics?.builtArea || concept.metrics?.builtArea)} sq.ft</p>
                          </div>
                          <div className="border border-[#E4E1D8] p-3">
                            <p className="text-[8px] uppercase tracking-[0.12em] text-[#73766F]">Validation</p>
                            <p className="mt-1 text-sm font-semibold text-[#53604F]">{concept.validation?.valid ? "Passed" : "Review"}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 border border-[#E4E1D8] bg-white p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">Selected Vastu plan</p>
                  <h2 className="mt-2 text-2xl font-semibold">{selectedConcept?.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73766F]">{selectedConcept?.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShow3D(true)}
                  className="shrink-0 border border-[#53604F] bg-[#53604F] px-6 py-3 text-sm font-medium text-white hover:bg-[#43503F]"
                >
                  View selected plan in 3D
                </button>
              </div>
            </section>

            <ReasonPanel concept={selectedConcept} />
            <MultiFloorPlanningPanel
              requirements={requirements}
              aiAnalysis={aiAnalysis}
              concept={selectedConcept}
            />
            <RulesPanel />

            <section className="mt-8 flex flex-wrap gap-3 border border-[#E4E1D8] bg-white p-5">
              <button
                type="button"
                onClick={() => navigate("/concept-comparison", { state: { requirements, aiAnalysis, concepts, selectedConcept } })}
                className="border border-[#53604F] bg-[#53604F] px-6 py-3 text-sm font-medium text-white"
              >
                Compare Concepts
              </button>
              <button
                type="button"
                onClick={() => navigate("/customize-plan", { state: { requirements, aiAnalysis, selectedConcept } })}
                className="border border-[#71806B] bg-white px-6 py-3 text-sm font-medium text-[#53604F]"
              >
                Customize Selected Plan
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate("/final-home", {
                    state: {
                      requirements,
                      aiAnalysis,
                      selectedConcept,
                      customizedConcept: selectedConcept,
                      furnitureAlreadyProvided: true,
                    },
                  })
                }
                className="border border-[#B86F52] bg-[#B86F52] px-6 py-3 text-sm font-medium text-white hover:bg-[#A75F45]"
              >
                View Final Home →
              </button>
            </section>
          </>
        )}

        <p className="mt-8 text-xs leading-5 text-[#73766F]">
          Conceptual / Not for construction. MyNest supports early planning; structural, electrical,
          plumbing, code and construction decisions must be verified by qualified professionals.
        </p>

        {show3D && selectedConcept && (
          <ThreeDVisualizationModal
            concept={selectedConcept}
            plot={plot}
            onClose={() => setShow3D(false)}
          />
        )}
      </main>
    </div>
  );
}
