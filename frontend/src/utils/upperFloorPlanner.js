// MyNest - Upper Floor Planner
// Creates a complete logical upper-floor concept without modifying
// the existing ground-floor generation logic.

const EPSILON = 0.05;

const STRATEGIES = {
  family: {
    id: "family",
    title: "Family Friendly",
    description:
      "A balanced upper floor focused on family interaction, comfortable bedrooms, and practical circulation.",
  },
  privacy: {
    id: "privacy",
    title: "Privacy First",
    description:
      "A more private upper floor with stronger separation between bedrooms and shared family spaces.",
  },
  spacious: {
    id: "spacious",
    title: "Spacious & Open",
    description:
      "An open-feeling upper floor with generous shared space, flexible rooms, and stronger outdoor connection.",
  },
};

const OPTIONAL_SPACE_DEFINITIONS = {
  study: {
    id: "study",
    label: "Study / Home Office",
    type: "study",
    minWidth: 8,
    minLength: 8,
  },
  storage: {
    id: "storage",
    label: "Extra Storage",
    type: "storage",
    minWidth: 5,
    minLength: 6,
  },
  utility: {
    id: "utility",
    label: "Laundry / Utility",
    type: "utility",
    minWidth: 6,
    minLength: 7,
  },
  guest: {
    id: "guest",
    label: "Guest Bedroom",
    type: "guest-bedroom",
    minWidth: 9,
    minLength: 10,
  },
  elder: {
    id: "elder",
    label: "Elder-Friendly Bedroom",
    type: "elder-bedroom",
    minWidth: 10,
    minLength: 10,
  },
  play: {
    id: "play",
    label: "Children's Activity Room",
    type: "activity-room",
    minWidth: 9,
    minLength: 10,
  },
};

const DEFAULT_ROOM_SIZES = {
  bedroom: {
    width: 11,
    length: 12,
  },
  master: {
    width: 13,
    length: 14,
  },
  bathroom: {
    width: 6,
    length: 8,
  },
  familyLounge: {
    width: 12,
    length: 13,
  },
};

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeStrategy(strategy) {
  if (!strategy) return "spacious";

  const value = String(strategy).toLowerCase();

  if (value.includes("family")) return "family";
  if (value.includes("privacy") || value.includes("private")) {
    return "privacy";
  }

  return "spacious";
}

function normalizeExtraSpaces(extraSpaces) {
  if (!Array.isArray(extraSpaces)) return [];

  return [
    ...new Set(
      extraSpaces
        .map((item) =>
          typeof item === "string"
            ? item
            : item?.id || item?.type || item?.key
        )
        .filter((item) => OPTIONAL_SPACE_DEFINITIONS[item])
    ),
  ];
}

function getPlot(requirements) {
  const width = num(
    requirements?.plotWidth ??
      requirements?.plot?.width ??
      requirements?.plot?.plotWidth,
    30
  );

  const length = num(
    requirements?.plotLength ??
      requirements?.plot?.length ??
      requirements?.plot?.plotLength,
    40
  );

  return {
    width: Math.max(width, 1),
    length: Math.max(length, 1),
  };
}

function getPreferences(requirements) {
  return requirements?.preferences || {};
}

function collectPreferenceText(requirements) {
  const preferences = getPreferences(requirements);

  const values = [];

  const collect = (value) => {
    if (value == null) return;

    if (typeof value === "string") {
      values.push(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    if (typeof value === "object") {
      Object.values(value).forEach(collect);
    }
  };

  collect(preferences);

  return values.join(" ").toLowerCase();
}

function preferenceIncludes(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function rectInside(rect, plot) {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= plot.width + EPSILON &&
    rect.y + rect.length <= plot.length + EPSILON
  );
}

function overlaps(a, b, gap = 0) {
  if (!a || !b) return false;

  const horizontal =
    a.x < b.x + b.width - gap &&
    a.x + a.width > b.x + gap;

  const vertical =
    a.y < b.y + b.length - gap &&
    a.y + a.length > b.y + gap;

  return horizontal && vertical;
}

function centerOf(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.length / 2,
  };
}

function distanceBetween(a, b) {
  const ca = centerOf(a);
  const cb = centerOf(b);

  return Math.sqrt(
    Math.pow(ca.x - cb.x, 2) +
      Math.pow(ca.y - cb.y, 2)
  );
}

function roomArea(room) {
  return Math.max(0, num(room?.width) * num(room?.length));
}

function createRoom({
  id,
  type,
  name,
  x,
  y,
  width,
  length,
  floorNumber = 2,
  zone,
  purpose,
  required = true,
  tags = [],
}) {
  return {
    id,
    type,
    name,
    x,
    y,
    width,
    length,
    floorNumber,
    zone,
    purpose,
    required,
    tags,
    area: width * length,
  };
}

function roomLabel(type) {
  const labels = {
    bedroom: "Bedroom",
    masterBedroom: "Master Bedroom",
    bathroom: "Bathroom",
    familyLounge: "Family Lounge",
    study: "Study / Home Office",
    storage: "Extra Storage",
    utility: "Laundry / Utility",
    "guest-bedroom": "Guest Bedroom",
    "elder-bedroom": "Elder-Friendly Bedroom",
    "activity-room": "Children's Activity Room",
    balcony: "Balcony",
    stair: "Staircase / Upper Landing",
  };

  return labels[type] || "Room";
}

function buildGrid(plot, step = 1) {
  const cells = [];

  for (let y = 0; y <= plot.length; y += step) {
    for (let x = 0; x <= plot.width; x += step) {
      cells.push({ x, y });
    }
  }

  return cells;
}

function findPlacement({
  plot,
  width,
  length,
  reserved,
  preferredZones = [],
  step = 1,
  margin = 0,
}) {
  const maxX = plot.width - width;
  const maxY = plot.length - length;

  if (maxX < 0 || maxY < 0) return null;

  const candidates = [];

  const addCandidate = (x, y, preferenceScore = 0) => {
    if (x < 0 || y < 0 || x > maxX || y > maxY) return;

    const candidate = {
      x,
      y,
      width,
      length,
    };

    if (!rectInside(candidate, plot)) return;

    const collision = reserved.some((room) =>
      overlaps(candidate, room, margin)
    );

    if (collision) return;

    candidates.push({
      ...candidate,
      preferenceScore,
    });
  };

  preferredZones.forEach((zone) => {
    const x = clamp(
      zone.x + (zone.width - width) / 2,
      0,
      maxX
    );

    const y = clamp(
      zone.y + (zone.length - length) / 2,
      0,
      maxY
    );

    addCandidate(x, y, 100);
  });

  for (const point of buildGrid(plot, step)) {
    addCandidate(point.x, point.y, 0);
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    if (b.preferenceScore !== a.preferenceScore) {
      return b.preferenceScore - a.preferenceScore;
    }

    return a.y - b.y || a.x - b.x;
  });

  return candidates[0];
}

function createDoor(room, side = "south") {
  const width = 3;

  if (side === "north") {
    return {
      id: `${room.id}-door`,
      roomId: room.id,
      side,
      x: room.x + room.width / 2 - width / 2,
      y: room.y,
      width,
      length: 0,
    };
  }

  if (side === "east") {
    return {
      id: `${room.id}-door`,
      roomId: room.id,
      side,
      x: room.x + room.width,
      y: room.y + room.length / 2 - width / 2,
      width: 0,
      length: width,
    };
  }

  if (side === "west") {
    return {
      id: `${room.id}-door`,
      roomId: room.id,
      side,
      x: room.x,
      y: room.y + room.length / 2 - width / 2,
      width: 0,
      length: width,
    };
  }

  return {
    id: `${room.id}-door`,
    roomId: room.id,
    side: "south",
    x: room.x + room.width / 2 - width / 2,
    y: room.y + room.length,
    width,
    length: 0,
  };
}

function createWindows(room, index = 0) {
  const windows = [];

  if (room.type === "stair") {
    return windows;
  }

  windows.push({
    id: `${room.id}-window-${index}`,
    roomId: room.id,
    side: index % 2 === 0 ? "east" : "west",
    width: Math.min(4, room.width * 0.35),
    length: 0,
  });

  return windows;
}

function stairCandidatePoints(plot, width, length) {
  const points = [];

  const xPositions = [
    1,
    plot.width - width - 1,
    plot.width / 2 - width / 2,
  ];

  const yPositions = [
    1,
    plot.length - length - 1,
    plot.length / 2 - length / 2,
  ];

  xPositions.forEach((x) => {
    yPositions.forEach((y) => {
      points.push({ x, y });
    });
  });

  return points;
}

function findAlignedStaircase(
  plot,
  groundConcept,
  reserved,
  width,
  length
) {
  const groundRooms = Array.isArray(groundConcept?.rooms)
    ? groundConcept.rooms
    : [];

  /*
   * IMPORTANT:
   * The ground-floor geometry is read only.
   * Nothing from the ground floor is modified.
   */

  // If the ground-floor concept exposes a shared vertical core,
  // prefer exactly that footprint.
  const existingCore = groundConcept?.verticalCore;

  if (
    existingCore &&
    Number.isFinite(existingCore.x) &&
    Number.isFinite(existingCore.y)
  ) {
    const aligned = {
      x: existingCore.x,
      y: existingCore.y,
      width: existingCore.width || width,
      length: existingCore.length || length,
    };

    if (
      rectInside(aligned, plot) &&
      !groundRooms.some((room) =>
        overlaps(aligned, room, 0.05)
      )
    ) {
      return {
        ...aligned,
        alignment: {
          source: "ground-floor-vertical-core",
          groundFloorCoreId: existingCore.id || null,
        },
      };
    }
  }

  // Otherwise find a footprint that is clear on both levels.
  for (const point of stairCandidatePoints(
    plot,
    width,
    length
  )) {
    const stair = {
      x: point.x,
      y: point.y,
      width,
      length,
    };

    if (
      rectInside(stair, plot) &&
      !groundRooms.some((room) =>
        overlaps(stair, room, 0.05)
      ) &&
      !reserved.some((room) =>
        overlaps(stair, room, 0.05)
      )
    ) {
      return {
        ...stair,
        alignment: {
          source: "ground-floor-clear-zone",
        },
      };
    }
  }

  // Fine scan prevents arbitrary staircase placement.
  const step = 1;

  for (
    let y = 0;
    y <= plot.length - length;
    y += step
  ) {
    for (
      let x = 0;
      x <= plot.width - width;
      x += step
    ) {
      const stair = {
        x,
        y,
        width,
        length,
      };

      if (
        groundRooms.some((room) =>
          overlaps(stair, room, 0.05)
        )
      ) {
        continue;
      }

      if (
        reserved.some((room) =>
          overlaps(stair, room, 0.05)
        )
      ) {
        continue;
      }

      return {
        ...stair,
        alignment: {
          source: "ground-floor-fine-scan",
        },
      };
    }
  }

  return null;
}

function createUpperStaircase(
  plot,
  groundConcept,
  reserved,
  rooms,
  warnings
) {
  const stairWidth = Math.min(5, plot.width * 0.17);
  const stairLength = Math.min(9, plot.length * 0.25);

  const alignedStair = findAlignedStaircase(
    plot,
    groundConcept,
    reserved,
    stairWidth,
    stairLength
  );

  const stair = alignedStair
    ? {
        id: "upper-stair-landing",
        name: "Staircase / Upper Landing",
        type: "stair",
        x: alignedStair.x,
        y: alignedStair.y,
        width: alignedStair.width,
        length: alignedStair.length,
        floorNumber: 2,
        zone: "vertical-circulation",
        purpose:
          "Vertical circulation connecting the ground floor and upper floor.",
        required: true,
        tags: [
          "staircase",
          "vertical-circulation",
          "floor-connection",
        ],
        area:
          alignedStair.width * alignedStair.length,
        alignment: alignedStair.alignment,
      }
    : null;

  if (stair) {
    reserved.push(stair);
    rooms.push(stair);
  } else {
    warnings.push(
      "No collision-free staircase zone could be aligned with the existing ground-floor geometry. The upper floor requires architectural review before vertical circulation is fixed."
    );
  }

  return stair;
}

function createPreferredZones(
  plot,
  strategy,
  stair
) {
  const zones = {
    bedroom: [],
    shared: [],
    service: [],
    flexible: [],
  };

  const left = {
    x: 0,
    y: 0,
    width: plot.width * 0.48,
    length: plot.length,
  };

  const right = {
    x: plot.width * 0.52,
    y: 0,
    width: plot.width * 0.48,
    length: plot.length,
  };

  const top = {
    x: 0,
    y: 0,
    width: plot.width,
    length: plot.length * 0.45,
  };

  const bottom = {
    x: 0,
    y: plot.length * 0.55,
    width: plot.width,
    length: plot.length * 0.45,
  };

  if (strategy === "privacy") {
    zones.bedroom.push(left, right);
    zones.shared.push(bottom);
    zones.flexible.push(top);
  } else if (strategy === "family") {
    zones.shared.push(bottom, top);
    zones.bedroom.push(left, right);
    zones.flexible.push(top);
  } else {
    zones.shared.push(top, bottom);
    zones.bedroom.push(left, right);
    zones.flexible.push(top, bottom);
  }

  if (stair) {
    const stairCenter = centerOf(stair);

    zones.shared.unshift({
      x: Math.max(0, stairCenter.x - plot.width * 0.2),
      y: Math.max(0, stairCenter.y - plot.length * 0.2),
      width: Math.min(plot.width * 0.4, plot.width),
      length: Math.min(plot.length * 0.4, plot.length),
    });
  }

  return zones;
}

function createRoomWithPlacement({
  plot,
  rooms,
  reserved,
  id,
  type,
  name,
  width,
  length,
  zone,
  purpose,
  preferredZones,
  required = true,
  tags = [],
}) {
  const placement = findPlacement({
    plot,
    width,
    length,
    reserved,
    preferredZones,
    step: 1,
    margin: 0.1,
  });

  if (!placement) {
    return null;
  }

  const room = createRoom({
    id,
    type,
    name,
    x: placement.x,
    y: placement.y,
    width,
    length,
    zone,
    purpose,
    required,
    tags,
  });

  rooms.push(room);
  reserved.push(room);

  return room;
}

function calculateServiceZone(plot, stair) {
  if (stair) {
    return {
      x: clamp(
        stair.x + stair.width + 1,
        0,
        Math.max(0, plot.width - 7)
      ),
      y: clamp(
        stair.y,
        0,
        Math.max(0, plot.length - 10)
      ),
      width: Math.min(7, plot.width),
      length: Math.min(10, plot.length),
    };
  }

  return {
    x: plot.width * 0.5 - 3.5,
    y: plot.length * 0.5 - 5,
    width: 7,
    length: 10,
  };
}

function serviceZoneAsPreference(zone) {
  return [zone];
}

function validateRooms(plot, rooms) {
  const errors = [];
  const warnings = [];

  rooms.forEach((room) => {
    if (!rectInside(room, plot)) {
      errors.push(
        `${room.name} is outside the available plot/buildable area.`
      );
    }

    if (room.width <= 0 || room.length <= 0) {
      errors.push(
        `${room.name} has invalid dimensions.`
      );
    }
  });

  for (let i = 0; i < rooms.length; i += 1) {
    for (let j = i + 1; j < rooms.length; j += 1) {
      const a = rooms[i];
      const b = rooms[j];

      if (a.type === "balcony" || b.type === "balcony") {
        continue;
      }

      if (overlaps(a, b, 0.02)) {
        errors.push(
          `${a.name} overlaps ${b.name}.`
        );
      }
    }
  }

  const usableRooms = rooms.filter(
    (room) =>
      room.type !== "balcony" &&
      room.type !== "stair"
  );

  if (usableRooms.length < 2) {
    warnings.push(
      "The upper floor contains too few usable spaces to form a complete residential program."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function createConnectivity(rooms, stair) {
  const connections = [];

  if (!stair) return connections;

  const nonStairRooms = rooms.filter(
    (room) =>
      room.type !== "stair" &&
      room.type !== "balcony"
  );

  nonStairRooms
    .sort(
      (a, b) =>
        distanceBetween(stair, a) -
        distanceBetween(stair, b)
    )
    .slice(0, Math.min(5, nonStairRooms.length))
    .forEach((room) => {
      connections.push({
        from: stair.id,
        to: room.id,
        type: "circulation",
        distance: distanceBetween(stair, room),
      });
    });

  return connections;
}

function createDoors(rooms) {
  return rooms
    .filter(
      (room) =>
        room.type !== "balcony"
    )
    .map((room, index) =>
      createDoor(
        room,
        index % 2 === 0 ? "south" : "north"
      )
    );
}

function createWindowsForRooms(rooms) {
  return rooms.flatMap((room, index) =>
    createWindows(room, index)
  );
}

function createBalcony({
  plot,
  rooms,
  reserved,
  strategy,
}) {
  const width = Math.min(
    strategy === "spacious" ? 14 : 11,
    plot.width * 0.5
  );

  const length = Math.min(
    5,
    plot.length * 0.18
  );

  const candidates = [
    {
      x: (plot.width - width) / 2,
      y: plot.length - length,
    },
    {
      x: 0,
      y: plot.length - length,
    },
    {
      x: plot.width - width,
      y: plot.length - length,
    },
  ];

  for (const candidate of candidates) {
    const balcony = {
      x: candidate.x,
      y: candidate.y,
      width,
      length,
    };

    if (!rectInside(balcony, plot)) {
      continue;
    }

    // Balconies can touch the outer edge and a room behind them.
    const conflicts = reserved.some((room) =>
      overlaps(balcony, room, 0.01)
    );

    if (!conflicts) {
      const room = createRoom({
        id: "upper-balcony",
        type: "balcony",
        name: "Balcony / Outdoor Space",
        x: balcony.x,
        y: balcony.y,
        width: balcony.width,
        length: balcony.length,
        zone: "outdoor",
        purpose:
          "Outdoor extension of the upper-floor living space.",
        required: false,
        tags: ["balcony", "outdoor"],
      });

      rooms.push(room);

      return room;
    }
  }

  return null;
}

function createVastuAssessment(rooms) {
  const assessment = {
    overall: "review",
    rules: [],
    notes: [],
  };

  const bedroomRooms = rooms.filter((room) =>
    [
      "bedroom",
      "masterBedroom",
      "guest-bedroom",
      "elder-bedroom",
    ].includes(room.type)
  );

  const bathrooms = rooms.filter(
    (room) => room.type === "bathroom"
  );

  const stair = rooms.find(
    (room) => room.type === "stair"
  );

  if (bedroomRooms.length) {
    assessment.rules.push({
      rule: "Bedroom placement",
      status: "checked",
      note:
        "Upper-floor bedrooms are kept away from the staircase whenever the available geometry permits.",
    });
  }

  if (bathrooms.length) {
    assessment.rules.push({
      rule: "Bathroom placement",
      status: "checked",
      note:
        "Bathrooms are grouped toward the preferred service zone where spatial constraints permit.",
    });
  }

  if (stair) {
    assessment.rules.push({
      rule: "Vertical circulation",
      status: "checked",
      note:
        "The upper staircase is aligned against the existing ground-floor geometry where a collision-free shared position exists.",
    });
  }

  assessment.notes.push(
    "Vastu is treated as a planning constraint alongside circulation, room dimensions, service alignment, and plot limitations."
  );

  assessment.overall = "review";

  return assessment;
}

function buildPlanningMetrics(
  rooms,
  requestedBedrooms,
  requestedBathrooms,
  optionalSpaces,
  balcony
) {
  const totalArea = rooms.reduce(
    (sum, room) => sum + roomArea(room),
    0
  );

  const bedrooms = rooms.filter((room) =>
    [
      "bedroom",
      "masterBedroom",
      "guest-bedroom",
      "elder-bedroom",
    ].includes(room.type)
  ).length;

  const bathrooms = rooms.filter(
    (room) => room.type === "bathroom"
  ).length;

  return {
    totalRoomArea: totalArea,
    requestedBedrooms,
    generatedBedrooms: bedrooms,
    requestedBathrooms,
    generatedBathrooms: bathrooms,
    optionalSpacesRequested: optionalSpaces.length,
    balconyRequested: Boolean(balcony),
    roomCount: rooms.length,
  };
}

function generateUpperFloorConcept(
  requirements,
  aiAnalysis,
  groundConcept,
  options = {}
) {
  const plot = getPlot(requirements);

  const strategy = normalizeStrategy(
    options.strategy ||
      groundConcept?.strategy ||
      groundConcept?.conceptStrategy ||
      "spacious"
  );

  const strategyInfo =
    STRATEGIES[strategy] ||
    STRATEGIES.spacious;

  const preferenceText =
    collectPreferenceText(requirements);

  let requestedBedrooms = clamp(
    num(options.bedrooms, 1),
    1,
    4
  );

  let requestedBathrooms = clamp(
    num(options.bathrooms, 1),
    1,
    3
  );

  const optionalSpaces = normalizeExtraSpaces(
    options.extraSpaces
  );

  let balconyRequested = Boolean(
    options.balcony
  );

  /*
   * Preference-aware defaults.
   * Explicit user selections always win.
   */
  if (!options.extraSpaces) {
    if (
      preferenceIncludes(preferenceText, [
        "study",
        "office",
        "work from home",
        "home office",
      ])
    ) {
      optionalSpaces.push("study");
    }

    if (
      preferenceIncludes(preferenceText, [
        "storage",
        "store room",
        "store",
      ])
    ) {
      optionalSpaces.push("storage");
    }

    if (
      preferenceIncludes(preferenceText, [
        "laundry",
        "utility",
        "washing",
      ])
    ) {
      optionalSpaces.push("utility");
    }

    if (
      preferenceIncludes(preferenceText, [
        "guest",
        "guest room",
      ])
    ) {
      optionalSpaces.push("guest");
    }

    if (
      preferenceIncludes(preferenceText, [
        "elder",
        "parents",
        "senior",
      ])
    ) {
      optionalSpaces.push("elder");
    }

    if (
      preferenceIncludes(preferenceText, [
        "children",
        "child",
        "play area",
        "play room",
      ])
    ) {
      optionalSpaces.push("play");
    }
  }

  if (
    options.balcony === undefined &&
    preferenceIncludes(preferenceText, [
      "balcony",
      "terrace",
      "outdoor",
      "open space",
    ])
  ) {
    balconyRequested = true;
  }

  const rooms = [];
  const reserved = [];
  const warnings = [];

  /*
   * ---------------------------------------------------------
   * STEP 1
   * Align the upper staircase with the existing ground floor.
   * Ground-floor geometry is read only.
   * ---------------------------------------------------------
   */
  const stair = createUpperStaircase(
    plot,
    groundConcept,
    reserved,
    rooms,
    warnings
  );

  const preferredZones = createPreferredZones(
    plot,
    strategy,
    stair
  );

  /*
   * ---------------------------------------------------------
   * STEP 2
   * Create the master bedroom.
   * ---------------------------------------------------------
   */
  const masterBedroom =
    createRoomWithPlacement({
      plot,
      rooms,
      reserved,
      id: "upper-master-bedroom",
      type: "masterBedroom",
      name: "Master Bedroom",
      width: DEFAULT_ROOM_SIZES.master.width,
      length: DEFAULT_ROOM_SIZES.master.length,
      zone: "private",
      purpose:
        "Primary private bedroom for the family.",
      preferredZones: preferredZones.bedroom,
      required: true,
      tags: ["bedroom", "master"],
    });

  if (!masterBedroom) {
    warnings.push(
      "Master bedroom could not be placed with the requested dimensions."
    );
  }

  /*
   * ---------------------------------------------------------
   * STEP 3
   * Additional bedrooms.
   * ---------------------------------------------------------
   */
  const additionalBedroomCount = Math.max(
    0,
    requestedBedrooms - 1
  );

  for (
    let index = 0;
    index < additionalBedroomCount;
    index += 1
  ) {
    const bedroom =
      createRoomWithPlacement({
        plot,
        rooms,
        reserved,
        id: `upper-bedroom-${index + 1}`,
        type: "bedroom",
        name: `Bedroom ${index + 2}`,
        width: DEFAULT_ROOM_SIZES.bedroom.width,
        length: DEFAULT_ROOM_SIZES.bedroom.length,
        zone: "private",
        purpose:
          "Private bedroom supporting the requested upper-floor family program.",
        preferredZones: preferredZones.bedroom,
        required: true,
        tags: ["bedroom"],
      });

    if (!bedroom) {
      warnings.push(
        `Bedroom ${index + 2} could not be placed with the requested dimensions.`
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * STEP 4
   * Family lounge.
   * ---------------------------------------------------------
   */
  const familyLounge =
    createRoomWithPlacement({
      plot,
      rooms,
      reserved,
      id: "upper-family-lounge",
      type: "familyLounge",
      name: "Family Lounge",
      width:
        strategy === "spacious"
          ? 14
          : DEFAULT_ROOM_SIZES.familyLounge.width,
      length:
        strategy === "spacious"
          ? 14
          : DEFAULT_ROOM_SIZES.familyLounge.length,
      zone: "shared",
      purpose:
        "Shared upper-floor space for family interaction and circulation.",
      preferredZones: preferredZones.shared,
      required: true,
      tags: ["shared", "family"],
    });

  if (!familyLounge) {
    warnings.push(
      "Family lounge could not be placed with the requested dimensions."
    );
  }

  /*
   * ---------------------------------------------------------
   * STEP 5
   * Bathrooms.
   *
   * Bathrooms are independently placed rather than being
   * generated from a fixed room list. This allows 1, 2 or 3
   * bathrooms to be requested without silently dropping one.
   * ---------------------------------------------------------
   */
  const verticalServiceZone =
    calculateServiceZone(plot, stair);

  for (
    let index = 0;
    index < requestedBathrooms;
    index += 1
  ) {
    const bathroom =
      createRoomWithPlacement({
        plot,
        rooms,
        reserved,
        id: `upper-bathroom-${index + 1}`,
        type: "bathroom",
        name: `Bathroom ${index + 1}`,
        width: DEFAULT_ROOM_SIZES.bathroom.width,
        length: DEFAULT_ROOM_SIZES.bathroom.length,
        zone: "service",
        purpose:
          index === 0
            ? "Primary upper-floor bathroom."
            : "Additional upper-floor bathroom.",
        preferredZones: [
          ...serviceZoneAsPreference(
            verticalServiceZone
          ),
          ...preferredZones.flexible,
        ],
        required: true,
        tags: [
          "bathroom",
          "service",
          "vertical-service",
        ],
      });

    if (!bathroom) {
      warnings.push(
        `Bathroom ${index + 1} could not be placed without violating the upper-floor spatial constraints.`
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * STEP 6
   * Optional spaces.
   * ---------------------------------------------------------
   */
  const uniqueOptionalSpaces = [
    ...new Set(optionalSpaces),
  ];

  uniqueOptionalSpaces.forEach((spaceId) => {
    const definition =
      OPTIONAL_SPACE_DEFINITIONS[spaceId];

    if (!definition) return;

    const room =
      createRoomWithPlacement({
        plot,
        rooms,
        reserved,
        id: `upper-${spaceId}`,
        type: definition.type,
        name: definition.label,
        width: definition.minWidth,
        length: definition.minLength,
        zone:
          spaceId === "study" ||
          spaceId === "play"
            ? "flexible"
            : spaceId === "storage" ||
              spaceId === "utility"
            ? "service"
            : "private",
        purpose:
          `Optional upper-floor space: ${definition.label}.`,
        preferredZones:
          spaceId === "storage" ||
          spaceId === "utility"
            ? [
                ...serviceZoneAsPreference(
                  verticalServiceZone
                ),
                ...preferredZones.flexible,
              ]
            : preferredZones.flexible,
        required: false,
        tags: ["optional", spaceId],
      });

    if (!room) {
      warnings.push(
        `${definition.label} was requested but could not be placed within the available upper-floor geometry.`
      );
    }
  });

  /*
   * ---------------------------------------------------------
   * STEP 7
   * Balcony / outdoor space.
   * ---------------------------------------------------------
   */
  let balcony = null;

  if (balconyRequested) {
    balcony = createBalcony({
      plot,
      rooms,
      reserved,
      strategy,
    });

    if (!balcony) {
      warnings.push(
        "Balcony / outdoor space was requested but could not be placed without conflicting with the upper-floor geometry."
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * STEP 8
   * Connectivity.
   * ---------------------------------------------------------
   */
  const connections = createConnectivity(
    rooms,
    stair
  );

  /*
   * ---------------------------------------------------------
   * STEP 9
   * Doors and windows.
   * ---------------------------------------------------------
   */
  const doors = createDoors(rooms);
  const windows = createWindowsForRooms(rooms);

  /*
   * ---------------------------------------------------------
   * STEP 10
   * Service alignment analysis.
   * ---------------------------------------------------------
   */
  const serviceRooms = rooms.filter(
    (room) =>
      room.type === "bathroom" ||
      room.type === "utility" ||
      room.type === "storage"
  );

  const serviceDistances = serviceRooms.map(
    (room) => ({
      roomId: room.id,
      roomName: room.name,
      distanceToVerticalServiceZone:
        distanceBetween(
          room,
          verticalServiceZone
        ),
    })
  );

  const distantServiceRooms =
    serviceDistances.filter(
      (item) =>
        item.distanceToVerticalServiceZone >
        Math.max(plot.width, plot.length) * 0.45
    );

  if (distantServiceRooms.length) {
    warnings.push(
      "Some upper-floor service spaces are distant from the preferred vertical service zone; plumbing alignment should be coordinated in the architectural design stage."
    );
  }

  /*
   * ---------------------------------------------------------
   * STEP 11
   * Validation.
   * ---------------------------------------------------------
   */
  const validation = validateRooms(
    plot,
    rooms
  );

  validation.warnings = [
    ...validation.warnings,
    ...warnings,
  ];

  if (!stair) {
    validation.errors.push(
      "Second-floor staircase could not be aligned to a collision-free zone on the existing ground floor."
    );

    validation.isValid = false;
  }

  /*
   * ---------------------------------------------------------
   * STEP 12
   * Vastu assessment.
   * ---------------------------------------------------------
   */
  const vastuAssessment =
    createVastuAssessment(rooms);

  /*
   * ---------------------------------------------------------
   * STEP 13
   * Planning metrics.
   * ---------------------------------------------------------
   */
  const planningMetrics =
    buildPlanningMetrics(
      rooms,
      requestedBedrooms,
      requestedBathrooms,
      uniqueOptionalSpaces,
      balconyRequested
    );

  /*
   * ---------------------------------------------------------
   * STEP 14
   * Planning notes.
   * ---------------------------------------------------------
   */
  const planningNotes = [
    strategyInfo.description,
    "The upper floor is planned independently as a complete residential program.",
    "The existing ground-floor geometry is treated as a reference and is not copied or mutated.",
    stair
      ? "The upper staircase is aligned with a collision-free location identified against the existing ground-floor geometry."
      : "The staircase could not be aligned automatically and requires architectural review.",
    "Bathrooms and utility spaces are checked against a preferred vertical service zone to support future plumbing coordination.",
    "Final structural design, wall thickness, columns, stair construction, and services require architectural/engineering validation.",
  ];

  /*
   * ---------------------------------------------------------
   * FINAL UPPER-FLOOR CONCEPT
   * ---------------------------------------------------------
   */
  const upperConcept = {
    id: `upper-${strategy}`,
    title: strategyInfo.title,
    strategy,
    description: strategyInfo.description,

    floorNumber: 2,
    isUpperFloor: true,
    isGroundFloor: false,

    plot: {
      width: plot.width,
      length: plot.length,
    },

    rooms,
    doors,
    windows,
    corridors: [
      {
        id: "upper-main-circulation",
        type: "circulation",
        connects: [
          "upper-stair-landing",
          "bedrooms",
          "family-lounge",
          "upper-bathrooms",
        ],
        purpose:
          "Logical circulation between vertical access, private rooms, shared spaces, and service spaces.",
      },
    ],

    outdoor: balcony
      ? [balcony]
      : [],

    entrance: stair
      ? {
          type: "stair",
          roomId: stair.id,
          location: {
            x:
              stair.x +
              stair.width / 2,
            y:
              stair.y +
              stair.length / 2,
          },
          rule:
            "Internal vertical circulation from the lower level",
        }
      : null,

    verticalCore: stair
      ? {
          id: "upper-stair-core",
          type: "stair-core",
          x: stair.x,
          y: stair.y,
          width: stair.width,
          length: stair.length,
          source:
            stair.alignment?.source ||
            "ground-floor-clear-zone",
          purpose:
            "Aligned vertical circulation between the ground and upper floors.",
          notes: [
            "The upper-floor staircase uses the same cleared footprint identified against the existing ground-floor room geometry, keeping vertical circulation aligned between levels.",
          ],
        }
      : {
          id: "upper-stair-core",
          type: "stair-core",
          x: 0,
          y: 0,
          width: stairWidth,
          length: stairLength,
          source: "unresolved",
          purpose:
            "Required vertical circulation.",
        },

    verticalServiceZone: {
      ...verticalServiceZone,
      purpose:
        "Preferred alignment zone for bathrooms and utility spaces across floors.",
      notes: [
        "This is a planning reference rather than a final plumbing design.",
        "Actual plumbing stacks must be coordinated with structural and architectural drawings.",
      ],
    },

    connectivity: connections,

    planningMetrics,

    validation,

    vastuAssessment,

    planningNotes,

    upperFloorProgram: {
      bedrooms: requestedBedrooms,
      bathrooms: requestedBathrooms,
      generatedBedrooms:
        planningMetrics.generatedBedrooms,
      generatedBathrooms:
        planningMetrics.generatedBathrooms,

      optionalSpaces:
        uniqueOptionalSpaces.map(
          (spaceId) =>
            OPTIONAL_SPACE_DEFINITIONS[
              spaceId
            ]?.label || spaceId
        ),

      balcony: balconyRequested,

      preferencesUsed: {
        textDetected:
          preferenceText.length > 0,
        sourceText:
          preferenceText,
        explicitExtras:
          uniqueOptionalSpaces,
      },

      verticalServiceZone,
    },

    groundFloorReference: groundConcept
      ? {
          conceptId:
            groundConcept.id || null,
          strategy:
            groundConcept.strategy ||
            strategy,
          note:
            "Reference only. Ground-floor geometry is not copied or mutated.",
          staircaseAlignment:
            stair
              ? {
                  x: stair.x,
                  y: stair.y,
                  width: stair.width,
                  length: stair.length,
                  source:
                    stair.alignment?.source ||
                    "ground-floor-clear-zone",
                }
              : null,
        }
      : {
          conceptId: null,
          strategy,
          note:
            "No ground-floor concept was supplied. Upper-floor planning uses the plot and selected requirements only.",
          staircaseAlignment: null,
        },

    aiAnalysisReference: aiAnalysis
      ? {
          available: true,
          note:
            "AI requirement analysis was supplied as planning context. The upper-floor geometry remains constraint-driven.",
        }
      : {
          available: false,
          note:
            "No AI analysis was supplied.",
        },
  };

  return upperConcept;
}

export { generateUpperFloorConcept };
export default generateUpperFloorConcept;