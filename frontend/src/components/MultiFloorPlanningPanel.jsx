import { useMemo, useState } from "react";

const FLOOR_OPTIONS = [
  {
    value: 1,
    label: "Ground Floor",
    short: "G",
    description: "Single-level home",
  },
  {
    value: 2,
    label: "Ground + 1",
    short: "G+1",
    description: "Two-level home",
  },
  {
    value: 3,
    label: "Ground + 2",
    short: "G+2",
    description: "Three-level home",
  },
];

function normalizeType(room) {
  return String(room?.type || "").toLowerCase();
}

function isBathroom(room) {
  return normalizeType(room) === "bathroom";
}

function isBedroom(room) {
  return normalizeType(room) === "bedroom";
}

function isPublicRoom(room) {
  return [
    "living",
    "dining",
    "kitchen",
    "pooja",
    "entry",
    "foyer",
    "family",
  ].includes(normalizeType(room));
}

function isServiceRoom(room) {
  return [
    "bathroom",
    "utility",
    "store",
    "storage",
    "wash",
  ].includes(normalizeType(room));
}

function isOutdoorRoom(room) {
  return [
    "balcony",
    "terrace",
    "verandah",
    "porch",
  ].includes(normalizeType(room));
}

function getBedroomPriority(room) {
  const name = String(room?.name || "").toLowerCase();

  if (
    name.includes("master") ||
    name.includes("primary")
  ) {
    return 1;
  }

  if (
    name.includes("child") ||
    name.includes("kids")
  ) {
    return 2;
  }

  return 3;
}

function getRoomArea(room) {
  const width = Number(room?.width) || 0;
  const length = Number(room?.length) || 0;

  return width * length;
}

function getRecommendedFloors(requirements, concept) {
  const bedrooms =
    Number(requirements?.bedrooms) ||
    (concept?.rooms || []).filter(isBedroom).length ||
    1;

  const bathrooms =
    Number(requirements?.bathrooms) ||
    (concept?.rooms || []).filter(isBathroom).length ||
    1;

  const plotWidth =
    Number(requirements?.plotWidth) || 30;

  const plotLength =
    Number(requirements?.plotLength) || 40;

  const plotArea = plotWidth * plotLength;

  const builtArea =
    Number(
      concept?.planningMetrics?.builtArea ??
        concept?.metrics?.builtArea
    ) || 0;

  const roomCount =
    concept?.rooms?.length ||
    bedrooms + bathrooms + 3;

  /*
   * Recommendation is a planning heuristic.
   * It does not replace structural or municipal approval.
   */

  if (bedrooms >= 5) {
    return 3;
  }

  if (bedrooms >= 3) {
    return 2;
  }

  if (builtArea > plotArea * 0.58) {
    return 2;
  }

  if (roomCount >= 9 && plotArea < 1400) {
    return 2;
  }

  return 1;
}

function sortBedrooms(rooms) {
  return [...rooms].sort(
    (a, b) =>
      getBedroomPriority(a) -
      getBedroomPriority(b)
  );
}

function allocateRooms(
  rooms,
  floorCount,
  requirements
) {
  const publicRooms = rooms.filter(isPublicRoom);
  const serviceRooms = rooms.filter(isServiceRoom);
  const bedrooms = sortBedrooms(
    rooms.filter(isBedroom)
  );
  const outdoorRooms = rooms.filter(isOutdoorRoom);

  const otherRooms = rooms.filter(
    (room) =>
      !isPublicRoom(room) &&
      !isServiceRoom(room) &&
      !isBedroom(room) &&
      !isOutdoorRoom(room)
  );

  const floors = Array.from(
    { length: floorCount },
    (_, index) => ({
      floor: index,
      name:
        index === 0
          ? "Ground Floor"
          : `First Floor${index > 1 ? ` +${index - 1}` : ""}`,
      rooms: [],
      purpose: "",
    })
  );

  /*
   * Ground floor:
   * Public spaces are kept together.
   * This reduces unnecessary vertical movement.
   */
  floors[0].rooms.push(...publicRooms);

  /*
   * Put the first bedroom on the ground floor
   * only when the user has multiple bedrooms and
   * the system considers accessibility useful.
   */
  const familySize =
    Number(requirements?.people) || 0;

  if (
    bedrooms.length > 1 &&
    familySize >= 5
  ) {
    floors[0].rooms.push(bedrooms.shift());
  }

  /*
   * Ground-floor service spaces.
   */
  floors[0].rooms.push(...serviceRooms);

  /*
   * Remaining bedrooms go upstairs.
   */
  if (floorCount === 1) {
    floors[0].rooms.push(...bedrooms);
  } else {
    const upperFloors = floors.slice(1);

    bedrooms.forEach((bedroom, index) => {
      const target =
        upperFloors[
          index % upperFloors.length
        ];

      target.rooms.push(bedroom);
    });
  }

  /*
   * Other spaces are distributed after the
   * primary room program has been established.
   */
  otherRooms.forEach((room, index) => {
    const target =
      floorCount === 1
        ? floors[0]
        : floors[
            (index + 1) % floorCount
          ];

    target.rooms.push(room);
  });

  /*
   * Outdoor spaces are kept close to the floor
   * containing their related private/common areas.
   */
  outdoorRooms.forEach((room, index) => {
    const target =
      floorCount === 1
        ? floors[0]
        : floors[
            Math.min(
              index + 1,
              floorCount - 1
            )
          ];

    target.rooms.push(room);
  });

  /*
   * Ensure every generated floor has a useful role.
   */
  floors.forEach((floor, index) => {
    const hasBedroom = floor.rooms.some(isBedroom);
    const hasPublic = floor.rooms.some(isPublicRoom);

    if (index === 0) {
      floor.purpose =
        "Entry, shared family spaces and essential services";
    } else if (hasBedroom) {
      floor.purpose =
        "Private bedroom and family zone";
    } else if (hasPublic) {
      floor.purpose =
        "Shared family and flexible-use zone";
    } else {
      floor.purpose =
        "Future expansion and supporting spaces";
    }
  });

  return floors;
}

function calculateFloorArea(floor) {
  return floor.rooms.reduce(
    (total, room) =>
      total + getRoomArea(room),
    0
  );
}

function getFloorLabel(index) {
  if (index === 0) return "G";
  if (index === 1) return "1";
  return String(index);
}

function getRoomCategory(room) {
  if (isBedroom(room)) return "Private";
  if (isPublicRoom(room)) return "Shared";
  if (isServiceRoom(room)) return "Service";
  if (isOutdoorRoom(room)) return "Outdoor";

  return "Flexible";
}

function FloorCard({ floor, totalFloors }) {
  const area = calculateFloorArea(floor);

  return (
    <div className="border border-[#E4E1D8] bg-white">

      <div className="flex items-center justify-between border-b border-[#E4E1D8] px-5 py-4">

        <div className="flex items-center gap-4">

          <div className="flex h-11 w-11 items-center justify-center border border-[#71806B] bg-[#F7F5EF] text-sm font-semibold text-[#53604F]">
            {getFloorLabel(floor.floor)}
          </div>

          <div>
            <h3 className="text-base font-semibold">
              {floor.name}
            </h3>

            <p className="mt-1 text-xs text-[#73766F]">
              {floor.purpose}
            </p>
          </div>

        </div>

        <div className="text-right">

          <p className="text-[9px] uppercase tracking-[0.12em] text-[#73766F]">
            Approx. room area
          </p>

          <p className="mt-1 text-sm font-semibold">
            {area.toLocaleString()} sq.ft
          </p>

        </div>

      </div>

      <div className="grid gap-2 p-5 sm:grid-cols-2">

        {floor.rooms.length === 0 ? (

          <div className="col-span-full border border-dashed border-[#D6D3C9] p-5 text-center">

            <p className="text-sm font-medium">
              No room assigned yet
            </p>

            <p className="mt-1 text-xs text-[#73766F]">
              Reserved for future planning.
            </p>

          </div>

        ) : (

          floor.rooms.map((room) => (

            <div
              key={room.id}
              className="flex items-center justify-between gap-3 border border-[#E4E1D8] bg-[#F7F5EF] px-4 py-3"
            >

              <div className="min-w-0">

                <p className="truncate text-sm font-medium">
                  {room.name}
                </p>

                <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[#73766F]">
                  {getRoomCategory(room)}
                </p>

              </div>

              <div className="shrink-0 text-right">

                <p className="text-xs font-semibold">
                  {Number(room.width) || "—"} ×{" "}
                  {Number(room.length) || "—"}
                </p>

                <p className="mt-1 text-[9px] text-[#73766F]">
                  ft
                </p>

              </div>

            </div>

          ))

        )}

      </div>

      {floor.floor > 0 && (
        <div className="border-t border-[#E4E1D8] bg-[#F7F5EF] px-5 py-3">

          <p className="text-[10px] leading-5 text-[#73766F]">
            Vertical access should connect this level to the
            staircase/core without disturbing bedroom privacy.
          </p>

        </div>
      )}

    </div>
  );
}

export default function MultiFloorPlanningPanel({
  requirements = {},
  concept = null,
  aiAnalysis = null,
  onContinue,
}) {
  const recommendedFloors = useMemo(
    () =>
      getRecommendedFloors(
        requirements,
        concept
      ),
    [requirements, concept]
  );

  const [mode, setMode] = useState("recommended");

  const [floorCount, setFloorCount] =
    useState(recommendedFloors);

  const rooms = useMemo(
    () => concept?.rooms || [],
    [concept]
  );

  const floors = useMemo(
    () =>
      allocateRooms(
        rooms,
        floorCount,
        requirements
      ),
    [
      rooms,
      floorCount,
      requirements,
    ]
  );

  const totalArea = floors.reduce(
    (total, floor) =>
      total + calculateFloorArea(floor),
    0
  );

  const bedroomCount = rooms.filter(
    isBedroom
  ).length;

  const bathroomCount = rooms.filter(
    isBathroom
  ).length;

  const hasMultipleFloors =
    floorCount > 1;

  const handleFloorChange = (value) => {
    const nextValue = Number(value);

    setMode("manual");
    setFloorCount(nextValue);
  };

  const handleContinue = () => {
    if (typeof onContinue === "function") {
      onContinue({
        floorCount,
        floors,
        recommendedFloors,
        mode,
        totalArea,
      });
    }
  };

  return (
    <section className="mt-10 border border-[#E4E1D8] bg-white">

      {/* HEADER */}

      <div className="border-b border-[#E4E1D8] px-6 py-6 md:px-8">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div className="max-w-3xl">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
              Multi-floor planning
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Should your home grow vertically?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#73766F]">
              MyNest evaluates your room requirements, plot capacity
              and family needs before suggesting whether a single-floor
              or multi-floor home is more suitable.
            </p>

          </div>

          <div className="border border-[#AAB9A2] bg-[#EEF3EB] px-5 py-4">

            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#53604F]">
              MyNest recommendation
            </p>

            <p className="mt-1 text-xl font-semibold text-[#53604F]">
              {recommendedFloors === 1
                ? "Ground Floor"
                : `G+${recommendedFloors - 1}`}
            </p>

            <p className="mt-1 text-xs text-[#73766F]">
              Based on the current planning brief
            </p>

          </div>

        </div>

      </div>

      {/* FLOOR CHOICE */}

      <div className="border-b border-[#E4E1D8] p-6 md:p-8">

        <div className="mb-4 flex items-center justify-between gap-4">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#71806B]">
              Choose number of floors
            </p>

            <p className="mt-1 text-xs text-[#73766F]">
              You can override the recommendation.
            </p>

          </div>

          {mode === "manual" && (
            <button
              type="button"
              onClick={() => {
                setMode("recommended");
                setFloorCount(recommendedFloors);
              }}
              className="text-xs font-semibold text-[#53604F] hover:text-[#B86F52]"
            >
              Use MyNest recommendation
            </button>
          )}

        </div>

        <div className="grid gap-3 md:grid-cols-3">

          {FLOOR_OPTIONS.map((option) => {

            const selected =
              floorCount === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  handleFloorChange(
                    option.value
                  )
                }
                className={`border p-5 text-left transition ${
                  selected
                    ? "border-[#53604F] bg-[#F1F4EF] shadow-[0_8px_24px_rgba(32,36,33,0.07)]"
                    : "border-[#E4E1D8] bg-white hover:border-[#71806B]"
                }`}
              >

                <div className="flex items-center justify-between">

                  <span
                    className={`text-2xl font-semibold ${
                      selected
                        ? "text-[#53604F]"
                        : "text-[#202421]"
                    }`}
                  >
                    {option.short}
                  </span>

                  {selected && (
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#53604F]">
                      Selected
                    </span>
                  )}

                </div>

                <p className="mt-4 text-sm font-semibold">
                  {option.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#73766F]">
                  {option.description}
                </p>

              </button>
            );
          })}

        </div>

      </div>

      {/* WHY */}

      <div className="grid gap-6 border-b border-[#E4E1D8] p-6 md:grid-cols-3 md:p-8">

        <div>

          <p className="text-[9px] uppercase tracking-[0.14em] text-[#73766F]">
            Bedrooms
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {bedroomCount}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#73766F]">
            Private rooms requiring appropriate zoning.
          </p>

        </div>

        <div>

          <p className="text-[9px] uppercase tracking-[0.14em] text-[#73766F]">
            Bathrooms
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {bathroomCount}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#73766F]">
            Bathroom access must remain meaningful on each level.
          </p>

        </div>

        <div>

          <p className="text-[9px] uppercase tracking-[0.14em] text-[#73766F]">
            Planned room area
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {totalArea.toLocaleString()}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#73766F]">
            sq.ft across the current conceptual program.
          </p>

        </div>

      </div>

      {/* FLOOR DISTRIBUTION */}

      <div className="p-6 md:p-8">

        <div className="mb-5">

          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B86F52]">
            Vertical distribution
          </p>

          <h3 className="mt-2 text-xl font-semibold">
            {floorCount === 1
              ? "Single-level arrangement"
              : `${floorCount}-level arrangement`}
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#73766F]">
            Public spaces remain concentrated toward the ground level,
            while private spaces can move upward when additional floors
            are selected. The existing room program is preserved.
          </p>

        </div>

        <div className="space-y-4">

          {floors.map((floor) => (
            <FloorCard
              key={floor.floor}
              floor={floor}
              totalFloors={floorCount}
            />
          ))}

        </div>

      </div>

      {/* VERTICAL CORE */}

      {hasMultipleFloors && (

        <div className="mx-6 mb-6 border border-[#E4E1D8] bg-[#F7F5EF] p-5 md:mx-8">

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#71806B] bg-white text-lg text-[#53604F]">
              ↕
            </div>

            <div>

              <p className="text-sm font-semibold">
                Vertical circulation required
              </p>

              <p className="mt-1 text-xs leading-5 text-[#73766F]">
                A staircase and circulation core must connect all selected
                floors. MyNest will treat staircase placement as part of
                the architectural planning problem rather than simply
                duplicating the same floor plan.
              </p>

            </div>

          </div>

        </div>

      )}

      {/* PLANNING NOTES */}

      <div className="grid gap-4 border-t border-[#E4E1D8] bg-[#202421] p-6 text-white md:grid-cols-3 md:p-8">

        <div>

          <p className="text-[9px] uppercase tracking-[0.15em] text-[#B9C4B1]">
            Ground floor
          </p>

          <p className="mt-2 text-sm leading-6 text-[#D7D9D5]">
            Prioritizes entrance, living, dining, kitchen and essential
            service access.
          </p>

        </div>

        <div>

          <p className="text-[9px] uppercase tracking-[0.15em] text-[#B9C4B1]">
            Upper floors
          </p>

          <p className="mt-2 text-sm leading-6 text-[#D7D9D5]">
            Prioritize privacy, bedrooms and family spaces while
            maintaining vertical access.
          </p>

        </div>

        <div>

          <p className="text-[9px] uppercase tracking-[0.15em] text-[#B9C4B1]">
            Next stage
          </p>

          <p className="mt-2 text-sm leading-6 text-[#D7D9D5]">
            The selected floor structure will later feed furniture
            optimization, interiors, costing and the final 3D walkthrough.
          </p>

        </div>

      </div>

      {/* CONTINUE */}

      {typeof onContinue === "function" && (

        <div className="flex justify-end border-t border-[#E4E1D8] bg-white p-5 md:p-6">

          <button
            type="button"
            onClick={handleContinue}
            className="bg-[#202421] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#53604F]"
          >
            Continue with {floorCount === 1 ? "Ground Floor" : `G+${floorCount - 1}`} →
          </button>

        </div>

      )}

    </section>
  );
}