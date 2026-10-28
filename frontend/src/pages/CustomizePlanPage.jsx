import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const customizationOptions = [
  {
    id: "master-bedroom",
    title: "Make master bedroom more spacious",
    description:
      "Increase the actual master bedroom area by using verified free space in the selected plan.",
  },
  {
    id: "kitchen-dining",
    title: "Keep kitchen next to dining",
    description:
      "Actually move the kitchen or dining room so the two spaces become physically adjacent.",
  },
  {
    id: "study-room",
    title: "Add a study / work room",
    description:
      "Add a real room only when a safe free area exists in the selected plan.",
  },
  {
    id: "storage",
    title: "Add more storage",
    description:
      "Add usable storage space without knowingly overlapping existing rooms.",
  },
  {
    id: "privacy",
    title: "Improve bedroom privacy",
    description:
      "Actually reposition private rooms away from the main shared-space zone when possible.",
  },
  {
    id: "natural-light",
    title: "Improve natural light",
    description:
      "Move suitable rooms toward an available exterior edge when the geometry permits it.",
  },
  {
    id: "future-expansion",
    title: "Keep space for future expansion",
    description:
      "Reserve a real free zone without covering an existing room.",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getPlot(requirements, concept) {
  const width = number(
    requirements?.plotWidth ?? concept?.plot?.width,
    30
  );

  const length = number(
    requirements?.plotLength ?? concept?.plot?.length,
    40
  );

  return {
    width: width > 0 ? width : 30,
    length: length > 0 ? length : 40,
  };
}

function roomRect(room) {
  return {
    x: number(room?.x),
    y: number(room?.y),
    width: number(room?.width ?? room?.w),
    length: number(room?.length ?? room?.h),
  };
}

function validRoom(room) {
  const r = roomRect(room);

  return (
    r.width > 0 &&
    r.length > 0
  );
}

function nameOf(room) {
  return String(
    room?.name ||
      room?.label ||
      room?.type ||
      ""
  ).toLowerCase();
}

function isBedroom(room) {
  const name = nameOf(room);

  return (
    name.includes("bedroom") ||
    name.includes("master") ||
    name.includes("primary bedroom")
  );
}

function isMaster(room) {
  const name = nameOf(room);

  return (
    name.includes("master") ||
    name.includes("primary bedroom")
  );
}

function isKitchen(room) {
  return nameOf(room).includes("kitchen");
}

function isDining(room) {
  return nameOf(room).includes("dining");
}

function isLiving(room) {
  const name = nameOf(room);

  return (
    name.includes("living") ||
    name.includes("family hall")
  );
}

function isPrivate(room) {
  const name = nameOf(room);

  return (
    isBedroom(room) ||
    name.includes("guest") ||
    name.includes("study")
  );
}

function inside(room, plot) {
  const r = roomRect(room);

  return (
    r.x >= 0 &&
    r.y >= 0 &&
    r.x + r.width <=
      plot.width + 0.001 &&
    r.y + r.length <=
      plot.length + 0.001
  );
}

function overlaps(
  a,
  b,
  gap = 0.15
) {
  const A = roomRect(a);
  const B = roomRect(b);

  return !(
    A.x + A.width <=
      B.x + gap ||
    B.x + B.width <=
      A.x + gap ||
    A.y + A.length <=
      B.y + gap ||
    B.y + B.length <=
      A.y + gap
  );
}

function canPlace(
  rooms,
  candidate,
  ignoredIds = []
) {
  return rooms.every((room) => {
    if (
      !room?.id ||
      ignoredIds.includes(room.id)
    ) {
      return true;
    }

    if (!validRoom(room)) {
      return true;
    }

    return !overlaps(
      candidate,
      room
    );
  });
}

function moveRoom(
  rooms,
  room,
  x,
  y,
  plot
) {
  if (!room) {
    return false;
  }

  const candidate = {
    ...room,
    x,
    y,
  };

  if (!inside(candidate, plot)) {
    return false;
  }

  if (
    !canPlace(
      rooms,
      candidate,
      [room.id]
    )
  ) {
    return false;
  }

  room.x = x;
  room.y = y;

  return true;
}

function findFreePosition(
  rooms,
  plot,
  width,
  length,
  preferred = []
) {
  const candidates = [
    ...preferred,
  ];

  for (
    let y = 0;
    y <= plot.length - length;
    y += 1
  ) {
    for (
      let x = 0;
      x <= plot.width - width;
      x += 1
    ) {
      candidates.push({
        x,
        y,
      });
    }
  }

  for (const position of candidates) {
    const candidate = {
      x: position.x,
      y: position.y,
      width,
      length,
    };

    if (
      inside(
        candidate,
        plot
      ) &&
      canPlace(
        rooms,
        candidate
      )
    ) {
      return candidate;
    }
  }

  return null;
}

function distanceBetween(
  a,
  b
) {
  const A = roomRect(a);
  const B = roomRect(b);

  const ax =
    A.x + A.width / 2;

  const ay =
    A.y + A.length / 2;

  const bx =
    B.x + B.width / 2;

  const by =
    B.y + B.length / 2;

  return Math.hypot(
    ax - bx,
    ay - by
  );
}

function moveRoomAdjacent(
  rooms,
  moving,
  target,
  plot
) {
  if (
    !moving ||
    !target
  ) {
    return false;
  }

  const M = roomRect(moving);
  const T = roomRect(target);

  const gap = 0.25;

  const candidates = [
    {
      x:
        T.x -
        M.width -
        gap,
      y: T.y,
    },
    {
      x:
        T.x +
        T.width +
        gap,
      y: T.y,
    },
    {
      x: T.x,
      y:
        T.y -
        M.length -
        gap,
    },
    {
      x: T.x,
      y:
        T.y +
        T.length +
        gap,
    },
  ];

  candidates.sort(
    (a, b) =>
      Math.hypot(
        a.x - M.x,
        a.y - M.y
      ) -
      Math.hypot(
        b.x - M.x,
        b.y - M.y
      )
  );

  for (
    const position of candidates
  ) {
    if (
      moveRoom(
        rooms,
        moving,
        position.x,
        position.y,
        plot
      )
    ) {
      return true;
    }
  }

  return false;
}

function expandRoomIntoFreeSpace(
  rooms,
  room,
  plot
) {
  if (!room) {
    return false;
  }

  const original =
    roomRect(room);

  const steps = [
    1,
    2,
    3,
    4,
  ];

  for (
    const amount of steps
  ) {
    const candidates = [
      {
        ...original,
        width:
          original.width +
          amount,
      },
      {
        ...original,
        length:
          original.length +
          amount,
      },
      {
        ...original,
        x:
          original.x -
          amount,
        width:
          original.width +
          amount,
      },
      {
        ...original,
        y:
          original.y -
          amount,
        length:
          original.length +
          amount,
      },
    ];

    for (
      const candidate of candidates
    ) {
      if (
        !inside(
          candidate,
          plot
        )
      ) {
        continue;
      }

      if (
        !canPlace(
          rooms,
          candidate,
          [room.id]
        )
      ) {
        continue;
      }

      room.x =
        candidate.x;

      room.y =
        candidate.y;

      room.width =
        candidate.width;

      room.length =
        candidate.length;

      room.area =
        candidate.width *
        candidate.length;

      room.customization =
        "Master bedroom enlarged";

      return true;
    }
  }

  return false;
}

function movePrivateRoomsAwayFromLiving(
  rooms,
  plot
) {
  const living =
    rooms.find(isLiving);

  const privateRooms =
    rooms.filter(
      isPrivate
    );

  if (
    !living ||
    privateRooms.length === 0
  ) {
    return false;
  }

  let changed = false;

  const livingDistance =
    (room) =>
      distanceBetween(
        room,
        living
      );

  privateRooms.sort(
    (a, b) =>
      livingDistance(a) -
      livingDistance(b)
  );

  for (
    const room of privateRooms
  ) {
    const currentDistance =
      livingDistance(room);

    const candidates = [];

    const current =
      roomRect(room);

    for (
      let y = 0;
      y <=
        plot.length -
          current.length;
      y += 1
    ) {
      for (
        let x = 0;
        x <=
          plot.width -
            current.width;
        x += 1
      ) {
        const candidate = {
          ...room,
          x,
          y,
        };

        if (
          !inside(
            candidate,
            plot
          )
        ) {
          continue;
        }

        if (
          !canPlace(
            rooms,
            candidate,
            [room.id]
          )
        ) {
          continue;
        }

        const distance =
          distanceBetween(
            candidate,
            living
          );

        if (
          distance >
          currentDistance + 2
        ) {
          candidates.push({
            candidate,
            distance,
          });
        }
      }
    }

    candidates.sort(
      (a, b) =>
        b.distance -
        a.distance
    );

    if (candidates[0]) {
      room.x =
        candidates[0]
          .candidate.x;

      room.y =
        candidates[0]
          .candidate.y;

      room.privacyPriority =
        "high";

      room.customization =
        "Moved for privacy";

      changed = true;
    }
  }

  return changed;
}

function moveRoomToExteriorEdge(
  rooms,
  room,
  plot
) {
  if (!room) {
    return false;
  }

  const r =
    roomRect(room);

  const candidates = [
    {
      x: 0,
      y: r.y,
    },
    {
      x:
        plot.width -
        r.width,
      y: r.y,
    },
    {
      x: r.x,
      y: 0,
    },
    {
      x: r.x,
      y:
        plot.length -
        r.length,
    },
  ];

  for (
    const candidate of candidates
  ) {
    if (
      moveRoom(
        rooms,
        room,
        candidate.x,
        candidate.y,
        plot
      )
    ) {
      room.daylightPriority =
        "high";

      room.customization =
        "Moved for natural light";

      return true;
    }
  }

  return false;
}

function addRoom(
  concept,
  plot,
  metadata
) {
  const rooms =
    concept.rooms || [];

  const position =
    findFreePosition(
      rooms,
      plot,
      metadata.width,
      metadata.length,
      metadata.preferred || []
    );

  if (!position) {
    return false;
  }

  rooms.push({
    id:
      `custom-${metadata.id}`,
    name:
      metadata.name,
    label:
      metadata.name,
    type:
      metadata.type,
    x:
      position.x,
    y:
      position.y,
    width:
      metadata.width,
    length:
      metadata.length,
    area:
      metadata.width *
      metadata.length,
    customGenerated:
      true,
    customization:
      metadata.customization,
  });

  concept.rooms =
    rooms;

  return true;
}

function applyCustomizations(
  baseConcept,
  requirements,
  changes
) {
  const concept =
    clone(baseConcept);

  const plot =
    getPlot(
      requirements,
      concept
    );

  const rooms =
    Array.isArray(
      concept.rooms
    )
      ? concept.rooms
      : [];

  const applied = [];
  const blocked = [];

  concept.rooms =
    rooms;

  for (
    const change of changes
  ) {
    if (
      change ===
      "master-bedroom"
    ) {
      const master =
        rooms.find(
          isMaster
        ) ||
        rooms.find(
          isBedroom
        );

      const success =
        expandRoomIntoFreeSpace(
          rooms,
          master,
          plot
        );

      if (success) {
        applied.push(
          change
        );
      } else {
        blocked.push(
          "The master bedroom could not be enlarged without overlapping another room or leaving the plot."
        );
      }
    }

    if (
      change ===
      "kitchen-dining"
    ) {
      const kitchen =
        rooms.find(
          isKitchen
        );

      const dining =
        rooms.find(
          isDining
        );

      if (
        !kitchen ||
        !dining
      ) {
        blocked.push(
          "Both kitchen and dining rooms are required for this change."
        );

        continue;
      }

      const kitchenToDining =
        moveRoomAdjacent(
          rooms,
          kitchen,
          dining,
          plot
        );

      const diningToKitchen =
        kitchenToDining
          ? true
          : moveRoomAdjacent(
              rooms,
              dining,
              kitchen,
              plot
            );

      if (
        kitchenToDining ||
        diningToKitchen
      ) {
        kitchen.relationshipPriority =
          "adjacent to dining";

        dining.relationshipPriority =
          "adjacent to kitchen";

        kitchen.customization =
          "Moved next to dining";

        dining.customization =
          "Moved next to kitchen";

        applied.push(
          change
        );
      } else {
        blocked.push(
          "Kitchen and dining could not be moved adjacent without creating a room conflict."
        );
      }
    }

    if (
      change ===
      "study-room"
    ) {
      const success =
        addRoom(
          concept,
          plot,
          {
            id:
              "study-room",
            name:
              "Study / Home Office",
            type:
              "study",
            width: 8,
            length: 8,
            customization:
              "Added from customization requirement",
            preferred: [
              {
                x: 0,
                y: 0,
              },
              {
                x: Math.max(
                  plot.width - 8,
                  0
                ),
                y: 0,
              },
              {
                x: 0,
                y: Math.max(
                  plot.length - 8,
                  0
                ),
              },
            ],
          }
        );

      if (success) {
        applied.push(
          change
        );
      } else {
        blocked.push(
          "No safe free area was available for the study."
        );
      }
    }

    if (
      change ===
      "storage"
    ) {
      const success =
        addRoom(
          concept,
          plot,
          {
            id:
              "storage",
            name:
              "Storage",
            type:
              "storage",
            width: 5,
            length: 6,
            customization:
              "Added from customization requirement",
            preferred: [
              {
                x: 0,
                y: 0,
              },
              {
                x: Math.max(
                  plot.width - 5,
                  0
                ),
                y: 0,
              },
              {
                x: 0,
                y: Math.max(
                  plot.length - 6,
                  0
                ),
              },
            ],
          }
        );

      if (success) {
        applied.push(
          change
        );
      } else {
        blocked.push(
          "No safe free area was available for additional storage."
        );
      }
    }

    if (
      change ===
      "privacy"
    ) {
      const success =
        movePrivateRoomsAwayFromLiving(
          rooms,
          plot
        );

      if (success) {
        applied.push(
          change
        );
      } else {
        blocked.push(
          "Private rooms could not be repositioned farther from the main shared zone without conflicts."
        );
      }
    }

    if (
      change ===
      "natural-light"
    ) {
      const targets =
        rooms.filter(
          (room) =>
            isLiving(room) ||
            isDining(room) ||
            isKitchen(room) ||
            isBedroom(room)
        );

      let moved =
        false;

      for (
        const room of targets
      ) {
        if (
          moveRoomToExteriorEdge(
            rooms,
            room,
            plot
          )
        ) {
          moved = true;
        }
      }

      if (moved) {
        applied.push(
          change
        );
      } else {
        blocked.push(
          "No selected room could be moved to an exterior edge without creating a conflict."
        );
      }
    }

    if (
      change ===
      "future-expansion"
    ) {
      const success =
        addRoom(
          concept,
          plot,
          {
            id:
              "future-expansion",
            name:
              "Future Expansion Zone",
            type:
              "future-expansion",
            width: 8,
            length: 8,
            customization:
              "Reserved from customization requirement",
            preferred: [
              {
                x: Math.max(
                  plot.width - 8,
                  0
                ),
                y: 0,
              },
              {
                x: 0,
                y: Math.max(
                  plot.length - 8,
                  0
                ),
              },
            ],
          }
        );

      if (success) {
        applied.push(
          change
        );
      } else {
        blocked.push(
          "No safe free area was available for future expansion."
        );
      }
    }
  }

  concept.customization =
    {
      requestedChanges:
        changes,
      appliedChanges:
        applied,
      blockedChanges:
        blocked,
    };

  concept.rooms =
    rooms.map(
      (room) => ({
        ...room,
        adjacentTo:
          Array.from(
            new Set(
              Array.isArray(
                room.adjacentTo
              )
                ? room.adjacentTo
                : []
            )
          ),
      })
    );

  return concept;
}

function detectCustomRequests(
  value
) {
  const text =
    String(
      value || ""
    ).toLowerCase();

  const changes = [];

  if (
    text.includes(
      "master bedroom"
    ) &&
    (
      text.includes(
        "big"
      ) ||
      text.includes(
        "large"
      ) ||
      text.includes(
        "spacious"
      ) ||
      text.includes(
        "bigger"
      )
    )
  ) {
    changes.push(
      "master-bedroom"
    );
  }

  if (
    text.includes(
      "kitchen"
    ) &&
    text.includes(
      "dining"
    )
  ) {
    changes.push(
      "kitchen-dining"
    );
  }

  if (
    text.includes(
      "study"
    ) ||
    text.includes(
      "work room"
    ) ||
    text.includes(
      "home office"
    ) ||
    text.includes(
      "office"
    )
  ) {
    changes.push(
      "study-room"
    );
  }

  if (
    text.includes(
      "storage"
    ) ||
    text.includes(
      "store room"
    )
  ) {
    changes.push(
      "storage"
    );
  }

  if (
    text.includes(
      "privacy"
    ) ||
    text.includes(
      "private"
    )
  ) {
    changes.push(
      "privacy"
    );
  }

  if (
    text.includes(
      "natural light"
    ) ||
    text.includes(
      "sunlight"
    ) ||
    text.includes(
      "daylight"
    )
  ) {
    changes.push(
      "natural-light"
    );
  }

  if (
    text.includes(
      "future expansion"
    ) ||
    text.includes(
      "expand later"
    ) ||
    text.includes(
      "future"
    )
  ) {
    changes.push(
      "future-expansion"
    );
  }

  return changes;
}

function displayName(
  room,
  index
) {
  if (room?.name) {
    return room.name;
  }

  if (room?.label) {
    return room.label;
  }

  if (isMaster(room)) {
    return "Master Bedroom";
  }

  if (isBedroom(room)) {
    return `Bedroom ${
      index + 1
    }`;
  }

  return (
    room?.type ||
    `Room ${index + 1}`
  );
}

function PlanPreview({
  concept,
  plot,
}) {
  const rooms =
    (
      concept?.rooms ||
      []
    ).filter(
      validRoom
    );

  const maxWidth =
    560;

  const maxHeight =
    390;

  const scale =
    Math.min(
      maxWidth /
        plot.width,
      maxHeight /
        plot.length
    );

  return (
    <div className="w-full overflow-auto bg-[#FAF9F5] p-5">
      <div
        className="relative mx-auto border border-[#202421] bg-white"
        style={{
          width:
            plot.width *
            scale,
          height:
            plot.length *
            scale,
          minWidth: 280,
          minHeight: 220,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(#E4E1D8 1px, transparent 1px), linear-gradient(90deg, #E4E1D8 1px, transparent 1px)",
            backgroundSize: `${Math.max(
              scale,
              10
            )}px ${Math.max(
              scale,
              10
            )}px`,
          }}
        />

        {rooms.map(
          (
            room,
            index
          ) => {
            const r =
              roomRect(
                room
              );

            const custom =
              room.customGenerated;

            const moved =
              Boolean(
                room.customization
              );

            return (
              <div
                key={
                  room.id ||
                  `${room.type}-${index}`
                }
                className={`absolute flex items-center justify-center overflow-hidden border px-1 text-center text-[9px] font-medium ${
                  custom
                    ? "border-dashed border-[#B86F52] bg-[#FFF8F3] text-[#8D5945]"
                    : moved
                    ? "border-[#B86F52] bg-[#FFF5EF] text-[#202421]"
                    : "border-[#53604F] bg-white text-[#202421]"
                }`}
                style={{
                  left:
                    r.x *
                    scale,
                  top:
                    r.y *
                    scale,
                  width:
                    r.width *
                    scale,
                  height:
                    r.length *
                    scale,
                }}
                title={`${displayName(
                  room,
                  index
                )} — ${r.width.toFixed(
                  1
                )} × ${r.length.toFixed(
                  1
                )} ft`}
              >
                {
                  displayName(
                    room,
                    index
                  )
                }
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function FurnitureSummary({
  requirements,
}) {
  const furniture =
    requirements?.furniture;

  if (!furniture) {
    return null;
  }

  const owned =
    Array.isArray(
      furniture.ownedFurniture
    )
      ? furniture.ownedFurniture
      : [];

  const planned =
    Array.isArray(
      furniture.plannedFurniture
    )
      ? furniture.plannedFurniture
      : [];

  const ownedAppliances =
    Array.isArray(
      furniture.ownedAppliances
    )
      ? furniture.ownedAppliances
      : [];

  const plannedAppliances =
    Array.isArray(
      furniture.plannedAppliances
    )
      ? furniture.plannedAppliances
      : [];

  return (
    <div className="mt-6 border border-[#E4E1D8] bg-[#FBFAF7] p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#73766F]">
        Furniture details retained
      </div>

      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <div className="font-semibold">
            Furniture
          </div>

          <p className="mt-1 leading-6 text-[#73766F]">
            {[
              ...owned,
              ...planned,
            ].join(", ") ||
              "Already captured in the previous stage."}
          </p>
        </div>

        <div>
          <div className="font-semibold">
            Appliances
          </div>

          <p className="mt-1 leading-6 text-[#73766F]">
            {[
              ...ownedAppliances,
              ...plannedAppliances,
            ].join(", ") ||
              "Already captured in the previous stage."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CustomizePlanPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const requirements =
    location.state?.requirements ||
    {};

  const selectedConcept =
    location.state
      ?.selectedConcept ||
    location.state?.concept ||
    null;

  const [
    selectedChanges,
    setSelectedChanges,
  ] = useState([]);

  const [
    customRequest,
    setCustomRequest,
  ] = useState("");

  const [
    currentConcept,
    setCurrentConcept,
  ] = useState(() =>
    clone(
      selectedConcept ||
        {
          rooms: [],
        }
    )
  );

  const [
    appliedChanges,
    setAppliedChanges,
  ] = useState([]);

  const [
    blockedChanges,
    setBlockedChanges,
  ] = useState([]);

  const [
    accepted,
    setAccepted,
  ] = useState(false);

  const plot =
    useMemo(
      () =>
        getPlot(
          requirements,
          currentConcept
        ),
      [
        requirements,
        currentConcept,
      ]
    );

  const toggleChange = (
    id
  ) => {
    setSelectedChanges(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    );

    setAccepted(false);
  };

  const handleApply =
    () => {
      if (
        !selectedConcept
      ) {
        return;
      }

      const typedChanges =
        detectCustomRequests(
          customRequest
        );

      const changes =
        Array.from(
          new Set([
            ...selectedChanges,
            ...typedChanges,
          ])
        );

      if (
        changes.length === 0
      ) {
        return;
      }

      const updated =
        applyCustomizations(
          selectedConcept,
          requirements,
          changes
        );

      setCurrentConcept(
        updated
      );

      setAppliedChanges(
        updated
          .customization
          .appliedChanges
      );

      setBlockedChanges(
        updated
          .customization
          .blockedChanges
      );

      setSelectedChanges(
        changes
      );

      setAccepted(false);
    };

  const handleReset =
    () => {
      setCurrentConcept(
        clone(
          selectedConcept ||
            {
              rooms: [],
            }
        )
      );

      setSelectedChanges(
        []
      );

      setAppliedChanges(
        []
      );

      setBlockedChanges(
        []
      );

      setCustomRequest(
        ""
      );

      setAccepted(false);
    };

  const handleAccept =
    () => {
      setAccepted(true);

      navigate(
        "/floor-plan",
        {
          state: {
            ...location.state,
            requirements,
            selectedConcept:
              currentConcept,
            concept:
              currentConcept,
            customizedConcept:
              currentConcept,
            appliedChanges,
            furniture:
              requirements?.furniture ||
              null,
            customizationAccepted:
              true,
          },
        }
      );
    };

  if (
    !selectedConcept
  ) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-8">
        <div className="mx-auto max-w-3xl border border-[#E4E1D8] bg-white p-8">
          <h1 className="text-2xl font-semibold">
            No concept selected
          </h1>

          <button
            onClick={() =>
              navigate(
                "/concept-comparison"
              )
            }
            className="mt-5 bg-[#53604F] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Concept Comparison
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">
      <header className="border-b border-[#E4E1D8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-[#53604F] font-semibold text-[#53604F]">
              N
            </div>

            <div>
              <div className="text-lg font-semibold">
                MyNest
              </div>

              <div className="text-[10px] uppercase tracking-[0.18em] text-[#73766F]">
                Intelligent Home Planning
              </div>
            </div>
          </div>

          <div className="text-xs uppercase tracking-[0.15em] text-[#73766F]">
            06 / 07
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
            Customize Your Concept
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Make the generated plan work for you.
          </h1>

          <p className="mt-4 text-base leading-7 text-[#73766F]">
            Changes are now applied to the actual rooms and coordinates of the selected concept instead of a separate placeholder layout.
          </p>
        </div>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-[#E4E1D8] bg-white p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71806B]">
              Planning Preferences
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              What should change?
            </h2>

            <div className="mt-6 space-y-3">
              {customizationOptions.map(
                (option) => {
                  const selected =
                    selectedChanges.includes(
                      option.id
                    );

                  return (
                    <button
                      key={
                        option.id
                      }
                      type="button"
                      onClick={() =>
                        toggleChange(
                          option.id
                        )
                      }
                      className={`flex w-full items-start gap-4 border p-4 text-left transition ${
                        selected
                          ? "border-[#53604F] bg-[#F5F7F2]"
                          : "border-[#E4E1D8] hover:border-[#A8ADA3]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                          selected
                            ? "border-[#53604F] bg-[#53604F] text-white"
                            : "border-[#B9BBB5]"
                        }`}
                      >
                        {selected &&
                          "✓"}
                      </div>

                      <div>
                        <div className="text-sm font-semibold">
                          {
                            option.title
                          }
                        </div>

                        <div className="mt-1 text-xs leading-5 text-[#73766F]">
                          {
                            option.description
                          }
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#73766F]">
                Describe anything else
              </label>

              <textarea
                value={
                  customRequest
                }
                onChange={(
                  event
                ) =>
                  setCustomRequest(
                    event.target
                      .value
                  )
                }
                rows={4}
                placeholder="Example: Move the master bedroom to the quieter rear side and keep the kitchen next to the dining room."
                className="w-full resize-none border border-[#E4E1D8] bg-[#FBFAF7] px-4 py-3 text-sm outline-none focus:border-[#71806B]"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={
                  handleApply
                }
                className="bg-[#53604F] px-6 py-3 text-sm font-semibold text-white"
              >
                Apply changes to plan
              </button>

              <button
                type="button"
                onClick={
                  handleReset
                }
                className="border border-[#E4E1D8] px-6 py-3 text-sm font-semibold text-[#53604F]"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="border border-[#E4E1D8] bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71806B]">
                  Updated Concept
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {currentConcept.title ||
                    "Customized Home Concept"}
                </h2>
              </div>

              <span className="border border-[#B8C4B0] bg-[#F5F7F2] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#53604F]">
                {accepted
                  ? "Accepted"
                  : "Editable"}
              </span>
            </div>

            <div className="mt-6 border border-[#E4E1D8] bg-[#FAF9F5]">
              <PlanPreview
                concept={
                  currentConcept
                }
                plot={plot}
              />
            </div>

            {appliedChanges.length >
              0 && (
              <div className="mt-6 border-t border-[#E4E1D8] pt-5">
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#73766F]">
                  Applied changes
                </div>

                <div className="mt-3 space-y-2">
                  {appliedChanges.map(
                    (change) => {
                      const option =
                        customizationOptions.find(
                          (item) =>
                            item.id ===
                            change
                        );

                      return (
                        <div
                          key={
                            change
                          }
                          className="flex gap-2 text-sm"
                        >
                          <span className="text-[#53604F]">
                            ✓
                          </span>

                          <span>
                            {
                              option?.title ||
                              change
                            }
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {blockedChanges.length >
              0 && (
              <div className="mt-5 border border-[#E4D8D2] bg-[#FFF8F3] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8D5945]">
                  Could not safely apply
                </div>

                <div className="mt-2 space-y-1 text-sm leading-6 text-[#73766F]">
                  {blockedChanges.map(
                    (item) => (
                      <p
                        key={
                          item
                        }
                      >
                        {item}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            <FurnitureSummary
              requirements={
                requirements
              }
            />
          </div>
        </section>

        <section className="mt-10 border border-[#E4E1D8] bg-[#202421] p-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B9C4B1]">
            Final planning handoff
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            Accept this customized concept
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#D7D9D5]">
            The accepted result carries the modified room geometry, your customization requirements, and the furniture details already collected. The next stage can use this exact result for the complete home visualization.
          </p>

          <button
            type="button"
            onClick={
              handleAccept
            }
            className="mt-6 bg-white px-6 py-3 text-sm font-semibold text-[#202421]"
          >
            Accept customized concept →
          </button>
        </section>

        <div className="mt-8">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/concept-comparison",
                {
                  state: {
                    ...location.state,
                    requirements,
                  },
                }
              )
            }
            className="border border-[#E4E1D8] bg-white px-6 py-3 text-sm font-semibold text-[#53604F]"
          >
            ← Back to comparison
          </button>
        </div>
      </main>
    </div>
  );
}