import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number % 1 === 0 ? String(number) : number.toFixed(1);
}

function roomFill(type) {
  if (type === "kitchen") return "#E6DED0";
  if (type === "bathroom") return "#DCE7E4";
  if (type === "bedroom") return "#E9E0D1";
  if (type === "pooja") return "#EFE4CC";
  if (type === "dining") return "#EEE9DE";
  if (type === "living") return "#E8E4DA";
  return "#EEECE5";
}

function MiniConceptPlan({ concept }) {
  if (!concept) return null;

  const plot = concept.plot || { width: 30, length: 40 };
  const rooms = concept.rooms || [];
  const outdoor = concept.outdoor || [];
  const pad = 4;
  const viewWidth = plot.width + pad * 2;
  const viewHeight = plot.length + pad * 2;

  return (
    <div className="overflow-hidden border border-[#D8D5CC] bg-[#DCE4D7]">
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="aspect-[3/4] h-auto w-full"
      >
        <defs>
          <pattern
            id={`floor-${concept.id}`}
            width="2"
            height="2"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 2 0 L 0 0 0 2"
              fill="none"
              stroke="#D2CEC3"
              strokeWidth="0.07"
            />
          </pattern>
        </defs>

        <rect width={viewWidth} height={viewHeight} fill="#DCE4D7" />

        <g transform={`translate(${pad} ${pad})`}>
          <rect
            width={plot.width}
            height={plot.length}
            fill="#F0EEE7"
            stroke="#3E423D"
            strokeWidth="0.45"
          />

          <rect
            width={plot.width}
            height={plot.length}
            fill={`url(#floor-${concept.id})`}
            opacity="0.4"
          />

          {outdoor.map((item) => {
            if (item.type !== "balcony") return null;

            const y = plot.length - item.y - item.length;

            return (
              <g key={item.id || `${item.type}-${item.x}-${item.y}`}>
                <rect
                  x={item.x}
                  y={y}
                  width={item.width}
                  height={item.length}
                  fill="#B8C9A9"
                  stroke="#65725F"
                  strokeWidth="0.22"
                />

                <text
                  x={item.x + item.width / 2}
                  y={y + item.length / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.65"
                  fill="#56624F"
                >
                  BALCONY
                </text>
              </g>
            );
          })}

          {rooms.map((room) => {
            const y = plot.length - room.y - room.length;
            const label = room.name || room.type || "Space";

            return (
              <g key={room.id}>
                <rect
                  x={room.x}
                  y={y}
                  width={room.width}
                  height={room.length}
                  fill={roomFill(room.type)}
                  stroke="#454842"
                  strokeWidth="0.34"
                />

                <rect
                  x={room.x + 0.28}
                  y={y + 0.28}
                  width={Math.max(0.1, room.width - 0.56)}
                  height={Math.max(0.1, room.length - 0.56)}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="0.08"
                  opacity="0.8"
                />

                <text
                  x={room.x + room.width / 2}
                  y={y + room.length * 0.48}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(
                    0.45,
                    Math.min(0.8, room.width / 16)
                  )}
                  fontWeight="700"
                  fill="#343733"
                >
                  {label.length > 15
                    ? `${label.slice(0, 13)}…`
                    : label}
                </text>

                <text
                  x={room.x + room.width / 2}
                  y={y + room.length * 0.61}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.38"
                  fill="#6C6E68"
                >
                  {formatNumber(room.width)} ×{" "}
                  {formatNumber(room.length)}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${plot.width - 2.4} 2.3)`}>
            <circle
              cx="0"
              cy="0"
              r="1"
              fill="white"
              stroke="#555951"
              strokeWidth="0.12"
            />

            <path
              d="M 0 -0.7 L 0.3 0.2 L 0 0.03 L -0.3 0.2 Z"
              fill="#555951"
            />

            <text
              x="0"
              y="1.7"
              textAnchor="middle"
              fontSize="0.58"
              fill="#555951"
            >
              N
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

function getConceptMetric(concept, key) {
  const metrics =
    concept?.planningMetrics ||
    concept?.metrics ||
    {};

  if (key === "efficiency") {
    return Number.isFinite(Number(metrics.efficiency))
      ? `${formatNumber(metrics.efficiency)}%`
      : "—";
  }

  if (key === "builtArea") {
    return Number.isFinite(Number(metrics.builtArea))
      ? `${formatNumber(metrics.builtArea)} sq.ft`
      : "—";
  }

  if (key === "circulation") {
    return Number.isFinite(Number(metrics.circulationArea))
      ? `${formatNumber(metrics.circulationArea)} sq.ft`
      : "—";
  }

  if (key === "validation") {
    return concept?.validation?.valid
      ? "Passed"
      : "Review";
  }

  if (key === "vastu") {
    const score = Number(
      concept?.vastuAssessment?.score ??
        concept?.vastu?.score
    );

    return Number.isFinite(score)
      ? `${formatNumber(score)}/100`
      : "—";
  }

  return "—";
}

function strategyTag(strategy) {
  if (strategy === "open") return "Shared-space focused";
  if (strategy === "privacy") return "Privacy focused";
  if (strategy === "compact") return "Space efficient";

  return "Planning strategy";
}

export default function ConceptComparisonPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};

  const requirements = state.requirements || {};
  const aiAnalysis = state.aiAnalysis || null;

  const concepts = useMemo(() => {
    if (Array.isArray(state.concepts)) {
      return state.concepts.filter(Boolean);
    }

    if (state.selectedConcept) {
      return [state.selectedConcept];
    }

    return [];
  }, [state.concepts, state.selectedConcept]);

  const [selectedId, setSelectedId] = useState(
    state.selectedConcept?.id ||
      concepts[0]?.id ||
      ""
  );

  const selectedConcept =
    concepts.find(
      (concept) => concept.id === selectedId
    ) ||
    concepts[0] ||
    null;

  const chooseConcept = () => {
    if (!selectedConcept) return;

    navigate("/customize-plan", {
      state: {
        requirements,
        aiAnalysis,
        selectedConcept,
        concepts,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">

      {/* HEADER */}
      <header className="border-b border-[#E4E1D8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <button
            type="button"
            onClick={() => navigate("/floor-plan")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center border border-[#71806B] text-sm font-semibold text-[#53604F]">
              N
            </div>

            <div>
              <div className="text-lg font-semibold tracking-tight">
                MyNest
              </div>

              <div className="text-[10px] uppercase tracking-[0.18em] text-[#73766F]">
                Intelligent Home Planning
              </div>
            </div>
          </button>

          <span className="text-xs uppercase tracking-[0.15em] text-[#73766F]">
            Concept Comparison
          </span>

        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-10">

        <section className="mb-10 max-w-4xl">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
            Planning decision
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Which direction feels right for your home?
          </h1>

          <p className="mt-4 text-base leading-7 text-[#73766F]">
            MyNest has already generated the validated concepts.
            Compare their planning strategies and choose one to
            customize further.
          </p>

        </section>

        {concepts.length === 0 ? (

          <section className="border border-[#B86F52] bg-[#FBEEE7] p-7">

            <h2 className="text-xl font-semibold">
              No concepts were passed to comparison.
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#73766F]">
              Return to the generated plans and select a concept first.
            </p>

            <button
              type="button"
              onClick={() => navigate("/floor-plan")}
              className="mt-5 bg-[#53604F] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Floor Plans
            </button>

          </section>

        ) : (

          <>

            {/* CONCEPT CARDS */}
            <section className="grid gap-6 lg:grid-cols-3">

              {concepts.map((concept, index) => {

                const selected =
                  concept.id === selectedConcept?.id;

                return (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(concept.id)
                    }
                    className={`border bg-white p-4 text-left transition ${
                      selected
                        ? "border-[#53604F] shadow-[0_16px_40px_rgba(32,36,33,0.12)]"
                        : "border-[#E4E1D8] hover:border-[#71806B]"
                    }`}
                  >

                    <MiniConceptPlan concept={concept} />

                    <div className="pt-5">

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B86F52]">
                          Concept {index + 1}
                        </p>

                        {selected && (
                          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#53604F]">
                            Selected
                          </span>
                        )}

                      </div>

                      <h2 className="mt-2 text-xl font-semibold">
                        {concept.title}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-[#73766F]">
                        {concept.summary ||
                          "A personalized residential planning strategy."}
                      </p>

                      <div className="mt-4 inline-flex border border-[#E4E1D8] bg-[#F7F5EF] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#53604F]">
                        {strategyTag(concept.strategy)}
                      </div>

                    </div>

                  </button>
                );
              })}

            </section>

            {/* METRICS */}
            <section className="mt-8 border border-[#E4E1D8] bg-white p-6 md:p-8">

              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
                    Side-by-side decision
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Planning metrics
                  </h2>
                </div>

                <p className="max-w-xl text-sm leading-6 text-[#73766F]">
                  These values describe the generated concepts.
                  They are planning indicators, not construction estimates.
                </p>

              </div>

              <div className="mt-6 overflow-x-auto">

                <table className="w-full min-w-[720px] border-collapse text-sm">

                  <thead>

                    <tr className="border-b border-[#DCD9D0] text-left">

                      <th className="px-4 py-4 font-medium text-[#73766F]">
                        Planning factor
                      </th>

                      {concepts.map((concept) => (
                        <th
                          key={concept.id}
                          className={`px-4 py-4 font-semibold ${
                            concept.id === selectedConcept?.id
                              ? "text-[#53604F]"
                              : ""
                          }`}
                        >
                          {concept.title}
                        </th>
                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {[
                      ["Space efficiency", "efficiency"],
                      ["Built area", "builtArea"],
                      ["Circulation reserve", "circulation"],
                      ["Vastu-oriented alignment", "vastu"],
                      ["Spatial validation", "validation"],
                    ].map(([label, key]) => (

                      <tr
                        key={key}
                        className="border-b border-[#E4E1D8] last:border-0"
                      >

                        <td className="px-4 py-4 text-[#73766F]">
                          {label}
                        </td>

                        {concepts.map((concept) => (

                          <td
                            key={concept.id}
                            className={`px-4 py-4 font-semibold ${
                              concept.id === selectedConcept?.id
                                ? "bg-[#F7F5EF] text-[#202421]"
                                : ""
                            }`}
                          >
                            {getConceptMetric(
                              concept,
                              key
                            )}
                          </td>

                        ))}

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </section>

            {/* WHY THIS CONCEPT + NEXT */}
            <section className="mt-8 grid gap-6 lg:grid-cols-2">

              <div className="border border-[#E4E1D8] bg-white p-6">

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71806B]">
                  Why this concept?
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {selectedConcept?.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#73766F]">
                  {selectedConcept?.summary}
                </p>

                <div className="mt-6 space-y-3">

                  {(
                    selectedConcept?.vastu?.strengths ||
                    selectedConcept?.vastuAssessment?.strengths ||
                    []
                  )
                    .slice(0, 5)
                    .map((item, index) => (

                      <div
                        key={index}
                        className="flex gap-3 border-b border-[#E4E1D8] pb-3 text-sm leading-6 text-[#73766F]"
                      >
                        <span className="font-semibold text-[#53604F]">
                          ✓
                        </span>

                        <span>{item}</span>
                      </div>

                    ))}

                </div>

              </div>

              <div className="border border-[#202421] bg-[#202421] p-6 text-white">

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B9C4B1]">
                  Next stage
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Make it yours.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#D7D9D5]">
                  Select this concept and MyNest will carry the chosen
                  plan into customization, where you can request changes
                  such as a larger bedroom, more storage, a study room,
                  improved privacy or future expansion.
                </p>

                <button
                  type="button"
                  onClick={chooseConcept}
                  className="mt-7 bg-white px-6 py-3 text-sm font-semibold text-[#202421] transition hover:bg-[#F7F5EF]"
                >
                  Choose{" "}
                  {selectedConcept?.title?.replace(
                    /^Vastu Plan \d+ — /,
                    ""
                  ) || "Concept"}{" "}
                  →
                </button>

              </div>

            </section>

            {/* BRIEF */}
            <section className="mt-8 border border-[#E4E1D8] bg-[#F7F5EF] p-5">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71806B]">
                    Your planning brief
                  </p>

                  <p className="mt-1 text-sm text-[#73766F]">
                    {requirements.plotWidth || "—"} ×{" "}
                    {requirements.plotLength || "—"} ft ·{" "}
                    {requirements.bedrooms || "—"} bedrooms ·{" "}
                    {requirements.bathrooms || "—"} bathrooms
                  </p>

                </div>

                <span className="text-xs text-[#73766F]">
                  Conceptual / Not for construction
                </span>

              </div>

            </section>

          </>

        )}

      </main>

    </div>
  );
}