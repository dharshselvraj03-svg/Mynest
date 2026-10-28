/*
 * MyNest — Architecture First Spatial Planning Engine
 *
 * This version generates THREE genuinely different residential arrangements
 * from the same requirements and the same Vastu constraints.
 *
 * Concepts:
 *   1. family     -> family interaction + efficient everyday movement
 *   2. private    -> public/private separation + controlled guest movement
 *   3. spacious   -> large shared zone + reduced corridor dominance
 *
 * Vastu is a shared constraint. It is NOT the reason the three plans differ.
 *
 * Conceptual planning only — not construction drawings.
 */

const DEFAULT_PLOT = { width: 30, length: 40 };

const MIN = {
  living: { width: 11, length: 10 },
  dining: { width: 8, length: 7 },
  kitchen: { width: 7, length: 9 },
  master: { width: 10, length: 11 },
  bedroom: { width: 9, length: 10 },
  bathroom: { width: 5, length: 6 },
  pooja: { width: 4, length: 4 },
};

const VASTU_RULES = {
  entrance: ["north", "east", "northeast"],
  living: ["north", "east", "northeast"],
  master: ["southwest"],
  child: ["northeast"],
  kitchen: ["southeast"],
  pooja: ["east", "northeast"],
  balcony: ["north", "east", "northeast"],
  water: ["north", "northeast"],
};

function n(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value) {
  return Number(Number(value).toFixed(2));
}

export function getPlot(requirements = {}) {
  const width = Math.max(20, n(requirements.plotWidth, DEFAULT_PLOT.width));
  const length = Math.max(20, n(requirements.plotLength, DEFAULT_PLOT.length));
  return { width, length, area: round(width * length) };
}

function count(requirements, key, fallback) {
  return Math.max(0, Math.round(n(requirements?.[key], fallback)));
}

function rect(room) {
  return {
    left: room.x,
    right: room.x + room.width,
    bottom: room.y,
    top: room.y + room.length,
  };
}

function overlaps(a, b, tolerance = 0.05) {
  const A = rect(a);
  const B = rect(b);
  return !(
    A.right <= B.left + tolerance ||
    B.right <= A.left + tolerance ||
    A.top <= B.bottom + tolerance ||
    B.top <= A.bottom + tolerance
  );
}

function touches(a, b, tolerance = 0.2) {
  const A = rect(a);
  const B = rect(b);

  const vertical =
    Math.abs(A.right - B.left) <= tolerance ||
    Math.abs(B.right - A.left) <= tolerance;

  const horizontal =
    Math.abs(A.top - B.bottom) <= tolerance ||
    Math.abs(B.top - A.bottom) <= tolerance;

  const yOverlap =
    Math.min(A.top, B.top) - Math.max(A.bottom, B.bottom) > 0.5;

  const xOverlap =
    Math.min(A.right, B.right) - Math.max(A.left, B.left) > 0.5;

  return (vertical && yOverlap) || (horizontal && xOverlap);
}

function inside(room, plot) {
  return (
    room.x >= 0 &&
    room.y >= 0 &&
    room.x + room.width <= plot.width + 0.001 &&
    room.y + room.length <= plot.length + 0.001
  );
}

function direction(room, plot) {
  const cx = room.x + room.width / 2;
  const cy = room.y + room.length / 2;
  const east = cx >= plot.width * 0.57;
  const west = cx <= plot.width * 0.43;
  const north = cy >= plot.length * 0.57;
  const south = cy <= plot.length * 0.43;

  if (north && east) return "northeast";
  if (north && west) return "northwest";
  if (south && east) return "southeast";
  if (south && west) return "southwest";
  if (north) return "north";
  if (south) return "south";
  if (east) return "east";
  return "west";
}

function makeRoom({
  id,
  name,
  type,
  x,
  y,
  width,
  length,
  zone,
  reason,
  vastu,
  access = [],
  adjacentTo = [],
  furniture = [],
  furnitureLayout = [],
}) {
  return {
    id,
    name,
    type,
    x: round(x),
    y: round(y),
    width: round(width),
    length: round(length),
    zone,
    reason,
    planningReason: reason,
    vastuReason: vastu,
    access,
    adjacentTo,
    furniture,
    furnitureLayout,
  };
}

function furnitureFor(type) {
  const data = {
    living: ["Sofa", "Coffee Table", "TV Unit", "Side Table"],
    dining: ["Rectangular Dining Table", "Dining Chairs"],
    bedroom: ["Bed", "Wardrobe", "Bedside Tables"],
    kitchen: [
      "Kitchen Counter",
      "Stove",
      "Sink",
      "Refrigerator",
      "Work Counter",
    ],
    bathroom: ["Wash Basin", "Shower", "WC"],
    pooja: ["Prayer Altar", "Storage"],
    foyer: ["Console Table", "Bench"],
    utility: ["Utility Counter", "Washing Machine", "Storage Cabinet"],
  };

  return data[type] || [];
}

function furnitureLayout(room) {
  const { x, y, width: w, length: h, type } = room;

  if (type === "living") {
    return [
      {
        type: "sofa",
        x: x + w * 0.12,
        y: y + h * 0.57,
        width: w * 0.66,
        length: 2.7,
      },
      {
        type: "coffee",
        x: x + w * 0.36,
        y: y + h * 0.35,
        width: w * 0.25,
        length: 2.1,
      },
      {
        type: "tv",
        x: x + w * 0.36,
        y: y + 0.35,
        width: w * 0.28,
        length: 0.7,
      },
    ];
  }

  if (type === "bedroom") {
    return [
      {
        type: "bed",
        x: x + w * 0.25,
        y: y + h * 0.35,
        width: w * 0.5,
        length: Math.min(6.8, h * 0.35),
      },
      {
        type: "wardrobe",
        x: x + 0.4,
        y: y + 0.5,
        width: Math.min(2.2, w * 0.18),
        length: Math.min(6.5, h * 0.55),
      },
      {
        type: "bedside",
        x: x + w * 0.18,
        y: y + h * 0.38,
        width: 1.2,
        length: 1.2,
      },
      {
        type: "bedside",
        x: x + w * 0.73,
        y: y + h * 0.38,
        width: 1.2,
        length: 1.2,
      },
    ];
  }

  if (type === "dining") {
    return [
      {
        type: "dining",
        x: x + w * 0.17,
        y: y + h * 0.28,
        width: w * 0.66,
        length: Math.min(3.2, h * 0.38),
      },
    ];
  }

  if (type === "kitchen") {
    return [
      {
        type: "counter",
        x: x + 0.4,
        y: y + h - 1.6,
        width: w - 0.8,
        length: 1.3,
      },
      {
        type: "counter",
        x: x + w - 1.65,
        y: y + 1,
        width: 1.25,
        length: h - 3,
      },
      {
        type: "stove",
        x: x + w - 3.1,
        y: y + h - 1.55,
        width: 1.5,
        length: 1,
      },
      {
        type: "sink",
        x: x + 0.9,
        y: y + h - 1.55,
        width: 1.5,
        length: 1,
      },
      {
        type: "fridge",
        x: x + 0.5,
        y: y + 0.8,
        width: 1.9,
        length: 2,
      },
    ];
  }

  if (type === "bathroom") {
    return [
      {
        type: "basin",
        x: x + 0.6,
        y: y + h - 1.5,
        width: 1.6,
        length: 1,
      },
      {
        type: "shower",
        x: x + w - 2,
        y: y + h - 2.3,
        width: 1.5,
        length: 1.7,
      },
      {
        type: "wc",
        x: x + 0.8,
        y: y + 0.9,
        width: 1.4,
        length: 1.8,
      },
    ];
  }

  if (type === "pooja") {
    return [
      {
        type: "altar",
        x: x + w * 0.18,
        y: y + h - 1.1,
        width: w * 0.64,
        length: 0.55,
      },
    ];
  }

  if (type === "foyer") {
    return [
      {
        type: "console",
        x: x + 0.45,
        y: y + h - 1.1,
        width: Math.min(3.2, w - 0.9),
        length: 0.6,
      },
      {
        type: "bench",
        x: x + 0.45,
        y: y + 0.8,
        width: Math.min(2.8, w - 0.9),
        length: 1.1,
      },
    ];
  }

  if (type === "utility") {
    return [
      {
        type: "utility-counter",
        x: x + 0.35,
        y: y + h - 1.5,
        width: w - 0.7,
        length: 1.1,
      },
      {
        type: "washing-machine",
        x: x + 0.5,
        y: y + 0.7,
        width: Math.min(2.1, w - 1),
        length: 2.1,
      },
    ];
  }

  return [];
}

function addRoom(state, room) {
  if (!inside(room, state.plot)) return false;
  if (state.rooms.some((existing) => overlaps(existing, room))) return false;
  state.rooms.push(room);
  return true;
}

function addDoor(state, id, from, to, side, position, width = 3) {
  state.doors.push({
    id,
    from,
    to,
    side,
    position,
    width,
    swing: "inward",
  });
}

function addWindow(state, id, room, side, position, width = 3) {
  state.windows.push({
    id,
    room,
    side,
    position,
    width,
  });
}

function makeRoomWithFurniture(args) {
  const room = makeRoom(args);
  room.furnitureLayout = furnitureLayout(room);
  return room;
}

function createAnchors(state, plot, scale, bedrooms) {
  const masterW = Math.max(
    MIN.master.width,
    Math.min(11 * scale, plot.width * 0.36)
  );

  const masterL = Math.max(
    MIN.master.length,
    Math.min(12 * scale, plot.length * 0.31)
  );

  const kitchenW = Math.max(
    MIN.kitchen.width,
    Math.min(8 * scale, plot.width * 0.28)
  );

  const kitchenL = Math.max(
    MIN.kitchen.length,
    Math.min(10 * scale, plot.length * 0.25)
  );

  const childW = Math.max(
    MIN.bedroom.width,
    Math.min(10 * scale, plot.width * 0.33)
  );

  const childL = Math.max(
    MIN.bedroom.length,
    Math.min(10 * scale, plot.length * 0.27)
  );

  const bathW = 5;
  const bathL = 6;

  const master = makeRoomWithFurniture({
    id: "master-bedroom",
    name: "Master Bedroom",
    type: "bedroom",
    x: 1,
    y: 1,
    width: masterW,
    length: masterL,
    zone: "private",
    reason:
      "The master bedroom is anchored in the southwest private zone and kept away from the main visitor path.",
    vastu: "Southwest master-bedroom placement.",
    access: ["private-circulation"],
    adjacentTo: ["master-bath"],
    furniture: furnitureFor("bedroom"),
  });

  addRoom(state, master);

  const masterBath = makeRoomWithFurniture({
    id: "master-bath",
    name: "Master Attached Bathroom",
    type: "bathroom",
    x: master.x + master.width + 0.2,
    y: master.y + master.length - bathL,
    width: bathW,
    length: bathL,
    zone: "private-service",
    reason:
      "The attached bathroom shares a wall with the master bedroom and avoids the public circulation path.",
    vastu:
      "Bathroom service planning is kept away from the sacred northeast zone.",
    access: ["master-bedroom"],
    adjacentTo: ["master-bedroom"],
    furniture: furnitureFor("bathroom"),
  });

  addRoom(state, masterBath);

  const kitchen = makeRoomWithFurniture({
    id: "kitchen",
    name: "Kitchen",
    type: "kitchen",
    x: plot.width - kitchenW - 1,
    y: 1,
    width: kitchenW,
    length: kitchenL,
    zone: "service",
    reason:
      "The kitchen occupies the southeast service zone and is planned around direct food/service relationships.",
    vastu:
      "Southeast kitchen with the cooking zone toward the southeast part of the room.",
    access: ["dining", "service"],
    adjacentTo: ["dining"],
    furniture: furnitureFor("kitchen"),
  });

  addRoom(state, kitchen);

  if (bedrooms >= 2) {
    const child = makeRoomWithFurniture({
      id: "bedroom-2",
      name: "Child Bedroom",
      type: "bedroom",
      x: plot.width - childW - 1,
      y: plot.length - childL - 1,
      width: childW,
      length: childL,
      zone: "private",
      reason:
        "The child bedroom occupies the northeast private zone and remains connected to family circulation.",
      vastu: "Northeast child-bedroom placement.",
      access: ["private-circulation"],
      adjacentTo: [],
      furniture: furnitureFor("bedroom"),
    });

    addRoom(state, child);
  }

  return {
    master,
    masterBath,
    kitchen,
    bathW,
    bathL,
    childW,
    childL,
    child: state.rooms.find((room) => room.id === "bedroom-2"),
  };
}

function addPooja(state, plot, preferred) {
  const candidates = preferred || [
    { x: plot.width * 0.57, y: plot.length * 0.69 },
    { x: plot.width * 0.48, y: plot.length * 0.7 },
    { x: plot.width * 0.62, y: plot.length * 0.62 },
  ];

  for (const candidate of candidates) {
    const room = makeRoomWithFurniture({
      id: "pooja",
      name: "Pooja Room",
      type: "pooja",
      x: candidate.x,
      y: candidate.y,
      width: 4,
      length: 4,
      zone: "sacred",
      reason:
        "The pooja room is kept in the east/northeast side and remains accessible without crossing bedroom zones.",
      vastu: "East/northeast pooja placement.",
      access: ["living", "dining"],
      adjacentTo: [],
      furniture: furnitureFor("pooja"),
    });

    if (
      inside(room, plot) &&
      !state.rooms.some((r) => overlaps(r, room))
    ) {
      addRoom(state, room);
      return room;
    }
  }

  state.warnings.push(
    "Pooja room could not be placed without conflict on this plot."
  );

  return null;
}

function addCommonBathroom(state, args) {
  const width = args.width || 5;
  const length = args.length || 6;

  const candidates = [
    { x: args.x, y: args.y },
    {
      x: 1,
      y: Math.max(1, state.plot.length * 0.52),
    },
    {
      x: Math.max(1, state.plot.width - width - 1),
      y: Math.max(1, state.plot.length * 0.52),
    },
    {
      x: 1,
      y: Math.max(1, state.plot.length - length - 8),
    },
    {
      x: Math.max(1, state.plot.width - width - 1),
      y: Math.max(1, state.plot.length - length - 8),
    },
    {
      x: Math.max(1, state.plot.width * 0.45),
      y: Math.max(1, state.plot.length * 0.48),
    },
  ];

  for (const candidate of candidates) {
    const room = makeRoomWithFurniture({
      id: "common-bath",
      name: args.name || "Common Bathroom",
      type: "bathroom",
      x: candidate.x,
      y: candidate.y,
      width,
      length,
      zone: args.zone || "service",
      reason:
        args.reason ||
        "The common bathroom is accessible from circulation without requiring bedroom access.",
      vastu: "Bathroom remains outside the northeast sacred zone.",
      access: args.access || ["main-circulation"],
      adjacentTo: args.adjacentTo || [],
      furniture: furnitureFor("bathroom"),
    });

    if (
      inside(room, state.plot) &&
      direction(room, state.plot) !== "northeast" &&
      !state.rooms.some((existing) => overlaps(existing, room))
    ) {
      addRoom(state, room);
      return room;
    }
  }

  state.warnings.push(
    "Common bathroom could not be placed without conflicting with required rooms."
  );

  return null;
}

function addAdditionalBedrooms(
  state,
  plot,
  scale,
  bedrooms,
  strategy
) {
  if (bedrooms <= 2) return;

  const w = Math.max(
    MIN.bedroom.width,
    Math.min(10 * scale, plot.width * 0.3)
  );

  const l = Math.max(
    MIN.bedroom.length,
    Math.min(10 * scale, plot.length * 0.23)
  );

  const candidates =
    strategy === "private"
      ? [
          { x: 1, y: 18 },
          {
            x: 1,
            y: Math.max(18, plot.length - l - 1),
          },
          {
            x: Math.max(1, plot.width * 0.3),
            y: Math.max(18, plot.length - l - 1),
          },
        ]
      : [
          {
            x: 1,
            y: Math.max(18, plot.length - l - 1),
          },
          {
            x: Math.max(1, plot.width * 0.3),
            y: Math.max(18, plot.length - l - 1),
          },
          { x: 1, y: 18 },
        ];

  for (let i = 3; i <= bedrooms; i++) {
    let placed = false;

    for (const candidate of candidates) {
      const room = makeRoomWithFurniture({
        id: `bedroom-${i}`,
        name: `Bedroom ${i}`,
        type: "bedroom",
        x: candidate.x,
        y: candidate.y,
        width: w,
        length: l,
        zone: "private",
        reason:
          "Additional bedroom is placed in the remaining private buildable area without displacing the mandatory Vastu anchors.",
        vastu:
          "Additional bedrooms do not override the southwest master or northeast child-bedroom constraints.",
        access: ["private-circulation"],
        adjacentTo: [],
        furniture: furnitureFor("bedroom"),
      });

      if (
        inside(room, plot) &&
        !state.rooms.some((r) => overlaps(r, room))
      ) {
        addRoom(state, room);
        placed = true;
        break;
      }
    }

    if (!placed) {
      state.warnings.push(
        `Bedroom ${i} requires a larger plot or a multi-floor solution.`
      );
    }
  }
}

function buildFamilyPlan(state, plot, scale, anchors) {
  const living = makeRoomWithFurniture({
    id: "living",
    name: "Family Living Room",
    type: "living",
    x: Math.max(1, plot.width * 0.43),
    y: anchors.kitchen.y + anchors.kitchen.length + 8,
    width: Math.min(15, plot.width * 0.5),
    length: Math.min(10, plot.length * 0.25),
    zone: "public-family",
    reason:
      "The family living room sits at the heart of the plan so parents, children and guests can naturally meet without crossing the private bedroom zone.",
    vastu: "North/east public-side living placement.",
    access: ["entrance", "dining", "private-circulation"],
    adjacentTo: ["dining", "pooja"],
    furniture: furnitureFor("living"),
  });

  if (!addRoom(state, living)) {
    state.warnings.push("Family living room could not be placed.");
  }

  const dining = makeRoomWithFurniture({
    id: "dining",
    name: "Family Dining",
    type: "dining",
    x: anchors.masterBath.x + anchors.masterBath.width + 0.2,
    y: anchors.kitchen.y + anchors.kitchen.length,
    width: Math.min(
      12,
      plot.width -
        (anchors.masterBath.x + anchors.masterBath.width + 0.2) -
        0.8
    ),
    length: 8,
    zone: "family",
    reason:
      "Dining is placed directly against the kitchen and close to living, creating a compact daily family triangle.",
    vastu:
      "Rectangular dining arrangement with east/west/north-facing seating options.",
    access: ["living", "kitchen"],
    adjacentTo: ["living", "kitchen"],
    furniture: furnitureFor("dining"),
  });

  if (!addRoom(state, dining)) {
    state.warnings.push("Family dining room could not be placed.");
  }

  if (state.program.bathrooms >= 2) {
    addCommonBathroom(state, {
      x: 1,
      y: Math.min(
        Math.max(
          anchors.master.y + anchors.master.length + 1,
          plot.length * 0.735
        ),
        plot.length - 13
      ),
      width: 5,
      length: 6,
      reason:
        "The common bathroom is near the family circulation edge so guests and children can reach it without crossing bedrooms.",
    });
  }

  addPooja(state, plot, [
    {
      x: plot.width * 0.48,
      y: plot.length * 0.735,
    },
    {
      x: plot.width * 0.46,
      y: plot.length * 0.7,
    },
  ]);

  state.corridors.push({
    id: "family-spine",
    name: "Family Circulation Spine",
    width: 4,
    connects: [
      "entrance",
      "living",
      "dining",
      "kitchen",
      "private-zone",
    ],
    planningReason:
      "A compact circulation spine links the spaces used most often by the family.",
  });

  return { living, dining };
}

function buildPrivatePlan(state, plot, scale, anchors) {
  const foyerCandidates = [
    {
      x: Math.max(1, plot.width - 7),
      y: plot.length - 8,
    },
    {
      x: 1,
      y: plot.length - 8,
    },
    {
      x: Math.max(1, plot.width - 7),
      y: Math.max(1, plot.length - 15),
    },
    {
      x: 1,
      y: Math.max(1, plot.length - 15),
    },
  ];

  let foyer = null;

  for (const candidate of foyerCandidates) {
    const candidateFoyer = makeRoomWithFurniture({
      id: "entry-foyer",
      name: "Entry Foyer",
      type: "foyer",
      x: candidate.x,
      y: candidate.y,
      width: 6,
      length: 7,
      zone: "transition",
      reason:
        "The foyer creates a psychological and physical buffer between the entrance and the private family areas.",
      vastu:
        "Located on the permitted north/east entry side.",
      access: ["entrance", "living"],
      adjacentTo: ["living"],
      furniture: furnitureFor("foyer"),
    });

    if (
      inside(candidateFoyer, plot) &&
      !state.rooms.some((room) => overlaps(room, candidateFoyer))
    ) {
      addRoom(state, candidateFoyer);
      foyer = candidateFoyer;
      break;
    }
  }

  if (!foyer) {
    state.warnings.push(
      "Privacy foyer could not be placed without conflicting with the required private rooms."
    );
  }

  const living = makeRoomWithFurniture({
    id: "living",
    name: "Guest Living Room",
    type: "living",
    x:
      anchors.child &&
      state.rooms.some((room) => room.id === "bedroom-3")
        ? 13.5
        : 7.5,
    y: plot.length * 0.47,
    width: Math.min(11, plot.width * 0.38),
    length: 10,
    zone: "guest-public",
    reason:
      "The guest living room is separated from the private bedroom zone by the foyer and controlled circulation.",
    vastu: "North/east public-side living placement.",
    access: ["entry-foyer", "dining"],
    adjacentTo: ["entry-foyer", "dining"],
    furniture: furnitureFor("living"),
  });

  if (!addRoom(state, living)) {
    state.warnings.push("Privacy living room could not be placed.");
  }

  const diningX = anchors.kitchen.x - 0.2;

  const dining = makeRoomWithFurniture({
    id: "dining",
    name: "Family Dining",
    type: "dining",
    x: diningX,
    y: anchors.kitchen.y + anchors.kitchen.length,
    width: anchors.kitchen.width,
    length: 8,
    zone: "family",
    reason:
      "Dining becomes the family transition zone between guest living and the kitchen/private circulation.",
    vastu:
      "Rectangular dining arrangement with east/west/north-facing seating options.",
    access: ["living", "kitchen", "private-circulation"],
    adjacentTo: ["kitchen", "living"],
    furniture: furnitureFor("dining"),
  });

  if (!addRoom(state, dining)) {
    state.warnings.push("Privacy dining room could not be placed.");
  }

  if (state.program.bathrooms >= 2) {
    addCommonBathroom(state, {
      x: plot.length > 45 ? 13.5 : 1,
      y: plot.length > 45 ? 36 : 22,
      width: 5,
      length: 6,
      name: "Guest Common Bathroom",
      zone: "guest-service",
      reason:
        "Guests can reach the bathroom directly from the public side without entering the private bedroom zone.",
      access: ["public-circulation"],
    });
  }

  addPooja(state, plot, [
    {
      x: plot.width * 0.733,
      y: plot.length > 45 ? 31 : 22,
    },
    {
      x: plot.width * 0.7,
      y: plot.length > 45 ? 32 : 23,
    },
  ]);

  state.corridors.push({
    id: "public-circulation",
    name: "Public Circulation",
    width: 4,
    connects: [
      "entrance",
      "entry-foyer",
      "living",
      "common-bath",
    ],
    planningReason:
      "Guest movement is kept within the public portion of the home.",
  });

  state.corridors.push({
    id: "private-circulation",
    name: "Private Circulation",
    width: 4,
    connects: [
      "dining",
      "master-bedroom",
      "bedroom-2",
      "private-zone",
    ],
    planningReason:
      "Bedrooms are accessed through a controlled family/private route rather than directly from the guest zone.",
  });

  return { living, dining, foyer };
}

function buildSpaciousPlan(
  state,
  plot,
  scale,
  anchors,
  requirements = {}
) {
  const thirdBedroom = state.rooms.find(
    (room) => room.id === "bedroom-3"
  );

  const spaciousLivingX = 7.3;
  const spaciousLivingWidth = Math.min(
    18,
    Math.max(11, plot.width * 0.38)
  );

  const spaciousLivingY = 19;
  const spaciousLivingLength = 10;

  const living = makeRoomWithFurniture({
    id: "living",
    name: "Large Family Living",
    type: "living",
    x: spaciousLivingX,
    y: spaciousLivingY,
    width: spaciousLivingWidth,
    length: spaciousLivingLength,
    zone: "large-shared",
    reason:
      "The living room is deliberately enlarged to become the principal shared family space, with generous furniture clearances and visual continuity.",
    vastu: "North/east public-side living placement.",
    access: ["entrance", "dining"],
    adjacentTo: ["dining", "pooja"],
    furniture: furnitureFor("living"),
  });

  if (!addRoom(state, living)) {
    state.warnings.push(
      "Spacious living room could not be placed."
    );
  }

  const dining = makeRoomWithFurniture({
    id: "dining",
    name: "Open Family Dining",
    type: "dining",
    x: anchors.masterBath.x + anchors.masterBath.width + 0.2,
    y: anchors.kitchen.y + anchors.kitchen.length,
    width: Math.min(
      12,
      plot.width -
        (anchors.masterBath.x + anchors.masterBath.width + 0.2) -
        0.8
    ),
    length: 8,
    zone: "large-shared",
    reason:
      "Dining is deliberately generous and visually linked to the large living zone while maintaining direct kitchen access.",
    vastu:
      "Rectangular dining arrangement with east/west/north-facing seating options.",
    access: ["living", "kitchen"],
    adjacentTo: ["living", "kitchen"],
    furniture: furnitureFor("dining"),
  });

  if (!addRoom(state, dining)) {
    state.warnings.push(
      "Spacious dining room could not be placed."
    );
  }

  const wantsUtility = Boolean(
    requirements?.utility ||
      requirements?.utilityRoom ||
      requirements?.washingMachine ||
      requirements?.storageNeeds
  );

  const utilityWidth = Math.min(
    5,
    Math.max(4, plot.width * 0.12)
  );

  const utility = wantsUtility
    ? makeRoomWithFurniture({
        id: "utility-room",
        name: "Kitchen Utility",
        type: "utility",
        x: anchors.kitchen.x - utilityWidth,
        y: anchors.kitchen.y,
        width: utilityWidth,
        length: Math.min(8, anchors.kitchen.length),
        zone: "service-buffer",
        reason:
          "A dedicated utility buffer keeps washing, storage and secondary work out of the main kitchen and preserves the open family zone.",
        vastu:
          "Utility remains within the southeast service cluster without displacing the kitchen anchor.",
        access: ["kitchen", "service"],
        adjacentTo: ["kitchen"],
        furniture: furnitureFor("utility"),
      })
    : null;

  if (
    utility &&
    !addRoom(state, utility)
  ) {
    state.warnings.push(
      "Utility room could not be placed beside the kitchen."
    );
  }

  if (state.program.bathrooms >= 2) {
    addCommonBathroom(state, {
      x: 1,
      y: Math.min(
        plot.length * 0.735,
        plot.length - 13
      ),
      width: 5,
      length: 6,
      reason:
        "The common bathroom is kept at the circulation edge so it does not consume the prime open family zone.",
    });
  }

  addPooja(
    state,
    plot,
    plot.length > 45
      ? [
          {
            x: plot.width * 0.48,
            y: plot.length * 0.735,
          },
          {
            x: plot.width * 0.45,
            y: plot.length * 0.76,
          },
        ]
      : [
          {
            x: plot.width * 0.47,
            y: plot.length * 0.73,
          },
          {
            x: plot.width * 0.45,
            y: plot.length * 0.75,
          },
        ]
  );

  state.corridors.push({
    id: "wide-family-circulation",
    name: "Wide Family Circulation",
    width: 5,
    connects: [
      "entrance",
      "living",
      "dining",
      "kitchen",
      "private-zone",
    ],
    planningReason:
      "Circulation is intentionally generous so the plan feels open instead of corridor-heavy.",
  });

  return { living, dining, utility };
}
function addDoors(state, strategy, bedrooms) {
  const living = state.rooms.find(
    (r) => r.id === "living"
  );

  addDoor(
    state,
    "main-door",
    "outside",
    strategy === "private"
      ? "entry-foyer"
      : "living",
    strategy === "private"
      ? "east"
      : strategy === "spacious"
        ? "northeast"
        : "north",
    "primary"
  );

  if (strategy === "private") {
    addDoor(
      state,
      "foyer-living-door",
      "entry-foyer",
      "living",
      "south",
      "middle"
    );
  }

  const privateCirculationId =
    strategy === "private"
      ? "private-circulation"
      : strategy === "spacious"
        ? "wide-family-circulation"
        : "family-spine";

  addDoor(
    state,
    "master-door",
    privateCirculationId,
    "master-bedroom",
    "north",
    "east-side"
  );

  addDoor(
    state,
    "master-bath-door",
    "master-bedroom",
    "master-bath",
    "east",
    "middle"
  );

  addDoor(
    state,
    "kitchen-door",
    "dining",
    "kitchen",
    "north",
    "middle"
  );

  addDoor(
    state,
    "living-dining-door",
    "living",
    "dining",
    "south",
    "middle"
  );

  if (
    state.rooms.some(
      (r) => r.id === "common-bath"
    )
  ) {
    const commonCirculationId =
      strategy === "private"
        ? "public-circulation"
        : strategy === "spacious"
          ? "wide-family-circulation"
          : "family-spine";

    addDoor(
      state,
      "common-bath-door",
      commonCirculationId,
      "common-bath",
      "south",
      "middle"
    );
  }

  if (
    state.rooms.some(
      (r) => r.id === "pooja"
    )
  ) {
    const pooja = state.rooms.find(
      (r) => r.id === "pooja"
    );

    if (living && pooja) {
      const side = touches(living, pooja)
        ? Math.abs(
            living.x +
              living.width -
              pooja.x
          ) < 0.25
          ? "east"
          : Math.abs(
                pooja.x +
                  pooja.width -
                  living.x
              ) < 0.25
            ? "west"
            : "south"
        : "south";

      addDoor(
        state,
        "pooja-door",
        "living",
        "pooja",
        side,
        "middle"
      );
    }
  }

  if (
    bedrooms >= 2 &&
    state.rooms.some(
      (r) => r.id === "bedroom-2"
    )
  ) {
    addDoor(
      state,
      "child-door",
      privateCirculationId,
      "bedroom-2",
      "south",
      "west"
    );
  }

  for (
    const room of state.rooms.filter(
      (r) =>
        /^bedroom-\d+$/.test(r.id) &&
        r.id !== "master-bedroom" &&
        r.id !== "bedroom-2"
    )
  ) {
    addDoor(
      state,
      `${room.id}-door`,
      privateCirculationId,
      room.id,
      "south",
      "middle"
    );
  }

  if (
    state.rooms.some(
      (r) => r.id === "utility-room"
    )
  ) {
    addDoor(
      state,
      "utility-door",
      "kitchen",
      "utility-room",
      "west",
      "middle"
    );
  }
}

function hasRoomOnSide(
  state,
  room,
  side
) {
  return state.rooms.some((other) => {
    if (other.id === room.id) return false;

    if (side === "north") {
      return (
        Math.abs(
          room.y +
            room.length -
            other.y
        ) <= 0.2 &&
        Math.min(
          room.x + room.width,
          other.x + other.width
        ) -
          Math.max(
            room.x,
            other.x
          ) >
          0.5
      );
    }

    if (side === "south") {
      return (
        Math.abs(
          room.y -
            (other.y +
              other.length)
        ) <= 0.2 &&
        Math.min(
          room.x + room.width,
          other.x + other.width
        ) -
          Math.max(
            room.x,
            other.x
          ) >
          0.5
      );
    }

    if (side === "east") {
      return (
        Math.abs(
          room.x +
            room.width -
            other.x
        ) <= 0.2 &&
        Math.min(
          room.y + room.length,
          other.y + other.length
        ) -
          Math.max(
            room.y,
            other.y
          ) >
          0.5
      );
    }

    return (
      Math.abs(
        room.x -
          (other.x +
            other.width)
      ) <= 0.2 &&
      Math.min(
        room.y + room.length,
        other.y + other.length
      ) -
        Math.max(
          room.y,
          other.y
        ) >
        0.5
    );
  });
}

function addWindows(state) {
  for (const room of state.rooms) {
    const candidates = [
      "north",
      "east",
      "west",
      "south",
    ];

    let added = 0;

    for (const side of candidates) {
      if (
        hasRoomOnSide(
          state,
          room,
          side
        )
      ) {
        continue;
      }

      const size = Math.min(
        room.type === "bathroom"
          ? 2
          : 4,
        side === "north" ||
          side === "south"
          ? room.width * 0.45
          : room.length * 0.45
      );

      addWindow(
        state,
        `${room.id}-${side}-window`,
        room.id,
        side,
        "middle",
        Math.max(1.2, size)
      );

      added += 1;

      if (
        added >=
        (room.type === "bathroom"
          ? 1
          : 2)
      ) {
        break;
      }
    }
  }
}

function addRequestedAdditionalBathrooms(
  state,
  plot,
  bathrooms
) {
  if (bathrooms <= 2) return;

  const existingCount = () =>
    state.rooms.filter(
      (room) =>
        room.type === "bathroom"
    ).length;

  const child = state.rooms.find(
    (room) =>
      room.id === "bedroom-2"
  );

  if (
    child &&
    existingCount() < bathrooms
  ) {
    const attachedCandidates = [
      {
        x: child.x - 5.2,
        y: child.y + 0.8,
      },
      {
        x: child.x - 5.2,
        y: child.y - 6.8,
      },
      {
        x:
          child.x +
          child.width -
          5,
        y: child.y - 6.8,
      },
    ];

    for (
      const candidate of attachedCandidates
    ) {
      const room =
        makeRoomWithFurniture({
          id: "child-bath",
          name:
            "Child Attached Bathroom",
          type: "bathroom",
          x: candidate.x,
          y: candidate.y,
          width: 5,
          length: 6,
          zone: "private-service",
          reason:
            "An additional attached bathroom is placed beside the child bedroom where geometry permits, keeping the requested bathroom count explicit.",
          vastu:
            "Bathroom is kept outside the northeast sacred zone.",
          access: ["bedroom-2"],
          adjacentTo: ["bedroom-2"],
          furniture:
            furnitureFor(
              "bathroom"
            ),
        });

      if (
        inside(room, plot) &&
        direction(
          room,
          plot
        ) !== "northeast" &&
        !state.rooms.some(
          (existing) =>
            overlaps(
              existing,
              room
            )
        ) &&
        touches(room, child)
      ) {
        addRoom(
          state,
          room
        );
        break;
      }
    }
  }

  while (
    existingCount() < bathrooms
  ) {
    let placed = false;

    for (
      let y = 1;
      y <= plot.length - 6;
      y += 1
    ) {
      for (
        let x = 1;
        x <= plot.width - 5;
        x += 1
      ) {
        const room =
          makeRoomWithFurniture({
            id: `additional-common-bath-${existingCount() + 1}`,
            name: `Additional Common Bathroom ${existingCount() - 1}`,
            type: "bathroom",
            x,
            y,
            width: 5,
            length: 6,
            zone: "service",
            reason:
              "An additional common bathroom is placed in leftover buildable space while avoiding bedrooms and the northeast sacred zone.",
            vastu:
              "Bathroom remains outside the northeast sacred zone.",
            access: ["circulation"],
            adjacentTo: [],
            furniture:
              furnitureFor(
                "bathroom"
              ),
          });

        if (
          !inside(
            room,
            plot
          )
        ) {
          continue;
        }

        if (
          direction(
            room,
            plot
          ) === "northeast"
        ) {
          continue;
        }

        if (
          state.rooms.some(
            (existing) =>
              overlaps(
                existing,
                room
              )
          )
        ) {
          continue;
        }

        addRoom(
          state,
          room
        );

        placed = true;
        break;
      }

      if (placed) break;
    }

    if (!placed) break;
  }

  if (
    existingCount() <
    bathrooms
  ) {
    state.warnings.push(
      `Requested ${bathrooms} bathrooms but only ${existingCount()} could be placed on this floor.`
    );
  }
}

function buildPlan(
  requirements,
  aiAnalysis,
  strategy
) {
  const plot =
    getPlot(requirements);

  const bedrooms = count(
    requirements,
    "bedrooms",
    2
  );

  const bathrooms = count(
    requirements,
    "bathrooms",
    2
  );

  const sx =
    plot.width / 30;

  const sy =
    plot.length / 40;

  const scale = Math.min(
    Math.max(
      Math.min(sx, sy),
      0.78
    ),
    1.35
  );

  const state = {
    plot,
    rooms: [],
    doors: [],
    windows: [],
    outdoor: [],
    corridors: [],
    warnings: [],
    strategy,
    program: {
      bedrooms,
      bathrooms,
    },
  };

  const anchors =
    createAnchors(
      state,
      plot,
      scale,
      bedrooms
    );

  addAdditionalBedrooms(
    state,
    plot,
    scale,
    bedrooms,
    strategy
  );

  if (strategy === "private") {
    buildPrivatePlan(
      state,
      plot,
      scale,
      anchors
    );
  } else if (
    strategy === "spacious"
  ) {
    buildSpaciousPlan(
      state,
      plot,
      scale,
      anchors,
      requirements
    );
  } else {
    buildFamilyPlan(
      state,
      plot,
      scale,
      anchors
    );
  }

  addRequestedAdditionalBathrooms(
    state,
    plot,
    bathrooms
  );

  addDoors(
    state,
    strategy,
    bedrooms
  );

  addWindows(state);

  const outdoorCandidates = [
    {
      id: "north-open-balcony",
      type: "balcony",
      name: "North / East Balcony",
      x: 1,
      y: Math.max(
        0,
        plot.length - 1.5
      ),
      width: Math.min(
        7,
        plot.width * 0.24
      ),
      length: 1.5,
      reason:
        "North/east edge reserved for balcony or open-space planning without overlapping enclosed rooms.",
    },
    {
      id: "north-water",
      type: "water",
      name:
        "North Water Resource Zone",
      x: Math.min(
        9,
        Math.max(
          1,
          plot.width * 0.22
        )
      ),
      y: Math.max(
        0,
        plot.length - 2
      ),
      width: 2,
      length: 1.5,
      reason:
        "North side reserved for water-resource planning without occupying an enclosed room.",
    },
  ];

  for (
    const zone of outdoorCandidates
  ) {
    if (
      !state.rooms.some(
        (room) =>
          overlaps(
            room,
            zone
          )
      )
    ) {
      state.outdoor.push(
        zone
      );
    }
  }

  state.entrance = {
    side:
      strategy === "private"
        ? "east"
        : strategy === "spacious"
          ? "northeast"
          : "north",

    location: {
      x:
        strategy === "private"
          ? plot.width - 0.1
          : Math.max(
              1,
              plot.width * 0.5
            ),
      y: plot.length - 0.1,
    },

    width: 4,

    reason:
      "The main entrance is positioned on a permitted north/east/northeast side and feeds the intended public circulation strategy.",

    vastu:
      "North / East / Northeast main entrance.",

    material:
      "Superior-quality wood",

    rule:
      "North / East / Northeast main entrance",
  };

  return state;
}

function validateFurniture(room) {
  const errors = [];
  const furniture =
    room.furnitureLayout || [];

  for (
    const item of furniture
  ) {
    if (
      item.x <
        room.x - 0.01 ||
      item.y <
        room.y - 0.01 ||
      item.x +
          item.width >
        room.x +
          room.width +
          0.01 ||
      item.y +
          item.length >
        room.y +
          room.length +
          0.01
    ) {
      errors.push(
        `${room.name} contains furniture outside its room.`
      );
    }
  }

  return errors;
}

function validate(state) {
  const errors = [];
  const rooms = state.rooms;

  for (
    const room of rooms
  ) {
    if (
      !inside(
        room,
        state.plot
      )
    ) {
      errors.push(
        `${room.name} is outside the plot.`
      );
    }

    errors.push(
      ...validateFurniture(
        room
      )
    );
  }

  for (
    let i = 0;
    i < rooms.length;
    i++
  ) {
    for (
      let j = i + 1;
      j < rooms.length;
      j++
    ) {
      if (
        overlaps(
          rooms[i],
          rooms[j]
        )
      ) {
        errors.push(
          `${rooms[i].name} overlaps ${rooms[j].name}.`
        );
      }
    }
  }

  const master =
    rooms.find(
      (r) =>
        r.id ===
        "master-bedroom"
    );

  const masterBath =
    rooms.find(
      (r) =>
        r.id ===
        "master-bath"
    );

  const child =
    rooms.find(
      (r) =>
        r.id ===
        "bedroom-2"
    );

  const kitchen =
    rooms.find(
      (r) =>
        r.id ===
        "kitchen"
    );

  const living =
    rooms.find(
      (r) =>
        r.id ===
        "living"
    );

  const dining =
    rooms.find(
      (r) =>
        r.id ===
        "dining"
    );

  const commonBath =
    rooms.find(
      (r) =>
        r.id ===
        "common-bath"
    );

  const pooja =
    rooms.find(
      (r) =>
        r.id ===
        "pooja"
    );

  const bedroomRooms =
    rooms.filter(
      (room) =>
        room.type ===
        "bedroom"
    );

  const bathroomRooms =
    rooms.filter(
      (room) =>
        room.type ===
        "bathroom"
    );

  if (
    bedroomRooms.length !==
    state.program.bedrooms
  ) {
    errors.push(
      `Requested ${state.program.bedrooms} bedrooms but ${bedroomRooms.length} bedrooms were generated.`
    );
  }

  if (
    bathroomRooms.length !==
    state.program.bathrooms
  ) {
    errors.push(
      `Requested ${state.program.bathrooms} bathrooms but ${bathroomRooms.length} bathrooms were generated.`
    );
  }

  const minimums = {
    living: MIN.living,
    dining: MIN.dining,
    kitchen: MIN.kitchen,
    bedroom: MIN.bedroom,
    bathroom: MIN.bathroom,
    pooja: MIN.pooja,
  };

  for (
    const room of rooms
  ) {
    const minimum =
      room.id ===
      "master-bedroom"
        ? MIN.master
        : minimums[
            room.type
          ];

    if (!minimum) continue;

    if (
      room.width <
        minimum.width ||
      room.length <
        minimum.length
    ) {
      errors.push(
        `${room.name} is smaller than the minimum planning size (${minimum.width} × ${minimum.length}).`
      );
    }
  }

  if (
    !master ||
    direction(
      master,
      state.plot
    ) !== "southwest"
  ) {
    errors.push(
      "Master bedroom violates southwest Vastu constraint."
    );
  }

  if (
    child &&
    direction(
      child,
      state.plot
    ) !== "northeast"
  ) {
    errors.push(
      "Child bedroom violates northeast Vastu constraint."
    );
  }

  if (
    !kitchen ||
    direction(
      kitchen,
      state.plot
    ) !== "southeast"
  ) {
    errors.push(
      "Kitchen violates southeast Vastu constraint."
    );
  }

  if (
    !living ||
    !VASTU_RULES.living.includes(
      direction(
        living,
        state.plot
      )
    )
  ) {
    errors.push(
      "Living room violates north/east/northeast Vastu constraint."
    );
  }

  if (
    !masterBath ||
    !master ||
    !touches(
      master,
      masterBath
    )
  ) {
    errors.push(
      "Master bathroom is not physically attached to the master bedroom."
    );
  }

  if (
    state.program
      .bathrooms >= 2
  ) {
    const nonAttachedBathrooms =
      bathroomRooms.filter(
        (room) =>
          room.id !==
          "master-bath"
      );

    if (
      nonAttachedBathrooms.length <
      state.program.bathrooms -
        1
    ) {
      errors.push(
        "A required common/service bathroom is missing."
      );
    }
  }

  if (
    kitchen &&
    dining &&
    !touches(
      kitchen,
      dining
    )
  ) {
    errors.push(
      "Kitchen and dining are not directly connected."
    );
  }

  if (
    living &&
    dining &&
    !touches(
      living,
      dining
    ) &&
    state.strategy !==
      "private"
  ) {
    errors.push(
      "Living and dining are not physically connected."
    );
  }

  if (pooja) {
    for (
      const bathroom of rooms.filter(
        (r) =>
          r.type ===
          "bathroom"
      )
    ) {
      if (
        touches(
          pooja,
          bathroom
        )
      ) {
        errors.push(
          "Pooja room cannot directly share a wall with a bathroom."
        );
      }
    }
  }

  for (
    const room of rooms
  ) {
    if (
      ["kitchen", "bathroom"].includes(
        room.type
      ) &&
      direction(
        room,
        state.plot
      ) === "northeast"
    ) {
      errors.push(
        `${room.name} occupies the northeast zone.`
      );
    }
  }

  if (
    state.strategy ===
    "private"
  ) {
    const foyer =
      rooms.find(
        (r) =>
          r.id ===
          "entry-foyer"
      );

    if (!foyer) {
      errors.push(
        "Privacy concept is missing its entry foyer."
      );
    }

    if (
      !state.corridors.some(
        (c) =>
          c.id ===
          "public-circulation"
      )
    ) {
      errors.push(
        "Privacy concept is missing public circulation."
      );
    }

    if (
      !state.corridors.some(
        (c) =>
          c.id ===
          "private-circulation"
      )
    ) {
      errors.push(
        "Privacy concept is missing private circulation."
      );
    }
  }

  if (
    state.strategy ===
    "spacious"
  ) {
    if (
      !state.corridors.some(
        (c) =>
          c.id ===
          "wide-family-circulation"
      )
    ) {
      errors.push(
        "Spacious concept is missing wide family circulation."
      );
    }

    if (
      living &&
      living.width <
        MIN.living.width
    ) {
      errors.push(
        "Spacious concept living zone is below the minimum living requirement."
      );
    }
  }

  return [
    ...new Set(errors),
  ];
}

function metrics(state) {
  const builtArea =
    state.rooms.reduce(
      (sum, room) =>
        sum +
        room.width *
          room.length,
      0
    );

  const circulationArea =
    Math.max(
      0,
      state.plot.area -
        builtArea
    );

  return {
    builtArea:
      round(builtArea),

    circulationArea:
      round(
        circulationArea
      ),

    efficiency:
      round(
        (builtArea /
          state.plot.area) *
          100
      ),

    roomCount:
      state.rooms.length,
  };
}

function adjacencyScore(state) {
  const checks = [];

  const byId = (id) =>
    state.rooms.find(
      (r) => r.id === id
    );

  const pairs = [
    ["kitchen", "dining"],
    ["living", "dining"],
    [
      "master-bedroom",
      "master-bath",
    ],
  ];

  for (
    const [aId, bId] of pairs
  ) {
    const a = byId(aId);
    const b = byId(bId);

    if (!a || !b) continue;

    checks.push(
      touches(a, b)
    );
  }

  if (
    state.strategy ===
    "private"
  ) {
    checks.push(
      Boolean(
        byId("entry-foyer")
      )
    );

    checks.push(
      Boolean(
        state.corridors.find(
          (c) =>
            c.id ===
            "public-circulation"
        )
      )
    );

    checks.push(
      Boolean(
        state.corridors.find(
          (c) =>
            c.id ===
            "private-circulation"
        )
      )
    );
  }

  if (
    state.strategy ===
    "spacious"
  ) {
    checks.push(
      Boolean(
        byId("utility-room")
      )
    );

    checks.push(
      Boolean(
        state.corridors.find(
          (c) =>
            c.id ===
            "wide-family-circulation"
        )
      )
    );
  }

  if (!checks.length)
    return 0;

  return round(
    (checks.filter(Boolean)
      .length /
      checks.length) *
      100
  );
}
function vastuAssessment(
  state,
  errors
) {
  let score = 100;

  score -= Math.min(
    60,
    errors.length * 8
  );

  const strengths = [
    "Master bedroom anchored in southwest.",
    "Kitchen anchored in southeast.",
    "Living room kept toward the north/east public side.",
    "Child bedroom anchored in northeast when requested.",
    "Kitchen and dining are directly connected.",
    "Master bathroom is physically attached.",
    "Common bathroom is separated from bedrooms.",
    "Pooja is kept away from bathrooms.",
    "North/east side is reserved for light, ventilation and open-space elements.",
  ];

  return {
    score: Math.max(
      0,
      score
    ),
    strengths,
    compromises:
      errors.length
        ? errors
        : [],
  };
}

function conceptProfile(
  strategy
) {
  const profiles = {
    family: {
      title:
        "Concept 01 — Family Friendly",

      summary:
        "A family-centred arrangement built around easy interaction between living, dining and kitchen while keeping bedrooms protected from the visitor path.",

      planningFocus:
        "Family interaction",

      zoning:
        "Central family zone with protected private rooms",

      circulation:
        "Compact everyday circulation",

      roomSizing:
        "Balanced room proportions",

      privacy: "Moderate",

      openness: "Moderate",

      signatureSpaces: [
        "Central family living",
        "Kitchen-dining connection",
      ],
    },

    private: {
      title:
        "Concept 02 — Privacy First",

      summary:
        "A privacy-led arrangement with a dedicated entry transition, guest-facing living and a separate private circulation layer.",

      planningFocus:
        "Privacy hierarchy",

      zoning:
        "Public → transition → family → private",

      circulation:
        "Separated public and private movement",

      roomSizing:
        "Controlled guest zone with protected private rooms",

      privacy: "High",

      openness: "Controlled",

      signatureSpaces: [
        "Entry foyer",
        "Separate private circulation",
      ],
    },

    spacious: {
      title:
        "Concept 03 — Spacious & Open",

      summary:
        "An open family arrangement that gives the largest share of usable space to shared living and dining while using generous shared-space proportions and, when requested, a dedicated utility buffer to keep service functions organized.",

      planningFocus:
        "Spatial openness",

      zoning:
        "Compact private anchors with enlarged shared zone",

      circulation:
        "Wide family circulation",

      roomSizing:
        "Shared spaces intentionally enlarged",

      privacy:
        "Moderate-high",

      openness: "High",

      signatureSpaces: [
        "Large family living",
        "Generous family circulation",
      ],
    },
  };

  return profiles[strategy];
}

function makeConcept(
  requirements,
  aiAnalysis,
  strategy
) {
  const state =
    buildPlan(
      requirements,
      aiAnalysis,
      strategy
    );

  const errors =
    validate(state);

  const assessment =
    vastuAssessment(
      state,
      errors
    );

  const profile =
    conceptProfile(
      strategy
    );

  const planMetrics =
    metrics(state);

  return {
    id: strategy,
    title: profile.title,
    strategy,
    summary: profile.summary,
    strategyProfile: profile,

    plot: state.plot,
    rooms: state.rooms,
    doors: state.doors,
    windows: state.windows,
    corridors:
      state.corridors,
    outdoor: state.outdoor,
    entrance:
      state.entrance,

    warnings:
      state.warnings,

    planningMetrics:
      planMetrics,

    metrics:
      planMetrics,

    adjacencyScore:
      adjacencyScore(state),

    validation: {
      valid:
        errors.length === 0,
      errors,
    },

    vastuAssessment:
      assessment,

    vastu: {
      status:
        errors.length === 0
          ? "Validated"
          : "Requires review",

      score:
        assessment.score,

      strengths:
        assessment.strengths,

      compromises:
        assessment.compromises,

      rulesApplied: [
        "Main entrance: North / East / Northeast.",
        "Living: North / East / Northeast.",
        "Master bedroom: Southwest.",
        "Child bedroom: Northeast.",
        "Kitchen: Southeast.",
        "Pooja: East / Northeast.",
        "Bathroom service zones kept away from the northeast sacred zone.",
        "Balcony: North / East / Northeast.",
        "Water resource: Northeast / North.",
        "Dining directly connected to kitchen.",
      ],
    },

    planningNotes: [
      "Room relationships are generated before visual rendering.",
      "The same geometry is passed to the 2D and 3D renderers.",
      "The three concepts use different spatial arrangements rather than only different labels or room sizes.",
      "Vastu constraints are common hard constraints across all concepts.",
      `Primary planning objective: ${profile.planningFocus}.`,
      `Signature spaces: ${profile.signatureSpaces.join(", ")}.`,
      "Overlap, containment, adjacency and furniture placement are validated before a concept is accepted.",
    ],

    aiAnalysis,
  };
}

export function generateAllConcepts(
  requirements = {},
  aiAnalysis = null
) {
  const strategies = [
    "family",
    "private",
    "spacious",
  ];

  const concepts =
    strategies.map(
      (strategy) =>
        makeConcept(
          requirements,
          aiAnalysis,
          strategy
        )
    );

  const valid =
    concepts.filter(
      (concept) =>
        concept.validation
          .valid
    );

  return {
    type:
      "mynest-logical-vastu-architecture",

    plot:
      getPlot(
        requirements
      ),

    concepts:
      valid.length ===
      concepts.length
        ? valid
        : concepts,

    validation: {
      valid:
        valid.length ===
        concepts.length,

      validConceptCount:
        valid.length,

      totalConceptCount:
        concepts.length,

      errors:
        concepts.flatMap(
          (concept) =>
            concept.validation
              .errors
        ),
    },

    overallPlanningNotes: [
      "MyNest generates a logical spatial program before rendering.",
      "Family Friendly, Privacy First and Spacious & Open are separate planning strategies with different room arrangements.",
      "Vastu rules are shared constraints rather than concept identities.",
      "A concept is not accepted when required rooms overlap, leave the plot, or violate core functional relationships.",
    ],
  };
}


/* --------------------------------------------------------------------------
 * Multi-floor house planning layer
 * --------------------------------------------------------------------------
 *
 * Phase 1 establishes a house-level planning model without changing the
 * existing single-floor generator. Each requested floor is generated as a
 * complete conceptual residential program, then checked as part of the
 * whole house for vertical circulation, service alignment and room counts.
 */

const MULTI_FLOOR_MAX = 3;

const STAIR_SIZE = {
  width: 5,
  length: 10,
};

const SERVICE_ZONE_SIZE = {
  width: 5,
  length: 6,
};

function distributeCount(
  total,
  floors
) {
  const safeTotal = Math.max(
    0,
    Math.round(
      n(total, 0)
    )
  );

  const safeFloors =
    Math.max(
      1,
      Math.round(
        n(floors, 1)
      )
    );

  const result =
    Array(safeFloors).fill(
      0
    );

  for (
    let index = 0;
    index < safeTotal;
    index += 1
  ) {
    result[
      index % safeFloors
    ] += 1;
  }

  return result;
}

function floorLabel(index) {
  if (index === 0)
    return "Ground Floor";

  if (index === 1)
    return "First Floor";

  if (index === 2)
    return "Second Floor";

  return `Floor ${index + 1}`;
}

function floorRequirements(
  requirements,
  floorIndex,
  floorCount
) {
  const bedrooms =
    distributeCount(
      count(
        requirements,
        "bedrooms",
        2
      ),
      floorCount
    );

  const bathrooms =
    distributeCount(
      count(
        requirements,
        "bathrooms",
        2
      ),
      floorCount
    );

  return {
    ...requirements,

    bedrooms:
      bedrooms[
        floorIndex
      ] || 0,

    bathrooms:
      bathrooms[
        floorIndex
      ] || 0,

    floorIndex,

    floorNumber:
      floorIndex + 1,

    floorCount,
  };
}

function roomCenter(room) {
  return {
    x:
      room.x +
      room.width / 2,

    y:
      room.y +
      room.length / 2,
  };
}

function distanceBetween(
  a,
  b
) {
  const A =
    roomCenter(a);

  const B =
    roomCenter(b);

  return Math.hypot(
    A.x - B.x,
    A.y - B.y
  );
}

function stairCandidates(
  plot
) {
  const margin = 1;

  const {
    width,
    length,
  } = STAIR_SIZE;

  const maxX =
    Math.max(
      margin,
      plot.width -
        width -
        margin
    );

  const maxY =
    Math.max(
      margin,
      plot.length -
        length -
        margin
    );

  const cx =
    Math.max(
      margin,
      Math.min(
        maxX,
        plot.width / 2 -
          width / 2
      )
    );

  const cy =
    Math.max(
      margin,
      Math.min(
        maxY,
        plot.length / 2 -
          length / 2
      )
    );

  return [
    { x: cx, y: cy },

    {
      x: margin,
      y: cy,
    },

    {
      x: maxX,
      y: cy,
    },

    {
      x: cx,
      y: margin,
    },

    {
      x: cx,
      y: maxY,
    },

    {
      x: margin,
      y: margin,
    },

    {
      x: maxX,
      y: margin,
    },

    {
      x: margin,
      y: maxY,
    },

    {
      x: maxX,
      y: maxY,
    },
  ];
}

function createVerticalCore(
  plot,
  rooms,
  floorIndex
) {
  const candidate =
    stairCandidates(
      plot
    ).find(
      (position) => {
        const stair = {
          x: position.x,
          y: position.y,
          width:
            STAIR_SIZE.width,
          length:
            STAIR_SIZE.length,
        };

        return !rooms.some(
          (room) =>
            overlaps(
              stair,
              room,
              0.05
            )
        );
      }
    );

  if (!candidate) {
    return {
      id: `stair-core-${floorIndex}`,

      type:
        "stair-core",

      name:
        floorIndex === 0
          ? "Staircase"
          : `Staircase from ${floorLabel(
              floorIndex
            )}`,

      x: null,
      y: null,

      width:
        STAIR_SIZE.width,

      length:
        STAIR_SIZE.length,

      status:
        "requires-review",

      planningReason:
        "No collision-free staircase zone was found inside the generated room arrangement; the floor requires architectural adjustment before vertical circulation is fixed.",

      connects: [
        floorLabel(
          floorIndex
        ),
        floorLabel(
          floorIndex + 1
        ),
      ],
    };
  }

  return {
    id: `stair-core-${floorIndex}`,

    type:
      "stair-core",

    name:
      floorIndex === 0
        ? "Staircase to First Floor"
        : `Staircase to ${floorLabel(
            floorIndex + 1
          )}`,

    x: round(
      candidate.x
    ),

    y: round(
      candidate.y
    ),

    width:
      STAIR_SIZE.width,

    length:
      STAIR_SIZE.length,

    status: "planned",

    connects: [
      floorLabel(
        floorIndex
      ),
      floorLabel(
        floorIndex + 1
      ),
    ],

    planningReason:
      "Reserved as a dedicated vertical circulation zone outside the generated room footprints so movement between floors does not require passing through private rooms.",
  };
}

function createSharedVerticalCores(
  plot,
  conceptFloors,
  floorCount
) {
  const candidates =
    stairCandidates(
      plot
    );

  const candidate =
    candidates.find(
      (position) => {
        const stair = {
          x: position.x,
          y: position.y,
          width:
            STAIR_SIZE.width,
          length:
            STAIR_SIZE.length,
        };

        return conceptFloors.every(
          (floor) =>
            !(
              floor?.rooms ||
              []
            ).some(
              (room) =>
                overlaps(
                  stair,
                  room,
                  0.05
                )
            )
        );
      }
    );

  return Array.from(
    {
      length: floorCount,
    },
    (_, floorIndex) => {
      if (!candidate) {
        return {
          id: `stair-core-${floorIndex}`,

          type:
            "stair-core",

          name:
            floorIndex === 0
              ? "Staircase to First Floor"
              : `Staircase at ${floorLabel(
                  floorIndex
                )}`,

          x: null,
          y: null,

          width:
            STAIR_SIZE.width,

          length:
            STAIR_SIZE.length,

          status:
            "requires-review",

          connects:
            floorIndex <
            floorCount - 1
              ? [
                  floorLabel(
                    floorIndex
                  ),
                  floorLabel(
                    floorIndex + 1
                  ),
                ]
              : [
                  floorLabel(
                    Math.max(
                      0,
                      floorIndex - 1
                    )
                  ),
                  floorLabel(
                    floorIndex
                  ),
                ],

          planningReason:
            "No single staircase position is collision-free on every floor. The house requires architectural adjustment before the vertical core can be fixed.",
        };
      }

      return {
        id: `stair-core-${floorIndex}`,

        type:
          "stair-core",

        name:
          floorIndex === 0
            ? "Staircase to First Floor"
            : floorIndex <
                floorCount - 1
              ? `Staircase from ${floorLabel(
                  floorIndex
                )} to ${floorLabel(
                  floorIndex + 1
                )}`
              : `Staircase arrival at ${floorLabel(
                  floorIndex
                )}`,

        x: round(
          candidate.x
        ),

        y: round(
          candidate.y
        ),

        width:
          STAIR_SIZE.width,

        length:
          STAIR_SIZE.length,

        status: "planned",

        connects:
          floorIndex <
          floorCount - 1
            ? [
                floorLabel(
                  floorIndex
                ),
                floorLabel(
                  floorIndex + 1
                ),
              ]
            : [
                floorLabel(
                  Math.max(
                    0,
                    floorIndex - 1
                  )
                ),
                floorLabel(
                  floorIndex
                ),
              ],

        planningReason:
          "The same vertical core footprint is reserved on every floor so the staircase remains vertically aligned instead of shifting between levels.",
      };
    }
  );
}

function chooseServiceStack(
  plot,
  floors
) {
  const bathroomRooms =
    floors.flatMap(
      (floor) =>
        (
          floor.rooms ||
          []
        )
          .filter(
            (room) =>
              room.type ===
              "bathroom"
          )
          .map(
            (room) => ({
              ...room,
              floorNumber:
                floor.floorNumber,
            })
          )
    );

  if (
    bathroomRooms.length ===
    0
  ) {
    return {
      status:
        "not-required",

      zone: null,

      rooms: [],

      planningReason:
        "No bathrooms were requested across the generated floors.",
    };
  }

  const candidates = [
    {
      x: Math.max(
        1,
        plot.width -
          SERVICE_ZONE_SIZE.width -
          1
      ),
      y: 1,
    },

    {
      x: 1,
      y: 1,
    },

    {
      x: Math.max(
        1,
        plot.width -
          SERVICE_ZONE_SIZE.width -
          1
      ),
      y: Math.max(
        1,
        plot.length -
          SERVICE_ZONE_SIZE.length -
          1
      ),
    },

    {
      x: 1,
      y: Math.max(
        1,
        plot.length -
          SERVICE_ZONE_SIZE.length -
          1
      ),
    },
  ];

  const scoreCandidate = (
    candidate
  ) => {
    const zone = {
      ...candidate,
      ...SERVICE_ZONE_SIZE,
    };

    return bathroomRooms.reduce(
      (score, room) => {
        const center =
          roomCenter(room);

        const zoneCenter =
          roomCenter(zone);

        return (
          score +
          Math.hypot(
            center.x -
              zoneCenter.x,
            center.y -
              zoneCenter.y
          )
        );
      },
      0
    );
  };

  const zonePosition =
    candidates.reduce(
      (
        best,
        candidate
      ) =>
        scoreCandidate(
          candidate
        ) <
        scoreCandidate(
          best
        )
          ? candidate
          : best
    );

  const zone = {
    id:
      "service-stack-zone",

    type:
      "service-stack",

    ...zonePosition,

    ...SERVICE_ZONE_SIZE,
  };

  return {
    status: "planned",

    zone,

    rooms:
      bathroomRooms.map(
        (room) => ({
          floorNumber:
            room.floorNumber,

          roomId: room.id,

          distanceToStack:
            round(
              distanceBetween(
                room,
                zone
              )
            ),
        })
      ),

    planningReason:
      "Bathrooms are checked against a shared vertical service zone so future plumbing can be planned as a stack rather than independently on every floor.",
  };
}
function validateHouseConcept(
  concept,
  requirements,
  floorCount
) {
  const errors = [];

  const floors =
    concept.floors || [];

  const requestedBedrooms =
    count(
      requirements,
      "bedrooms",
      2
    );

  const requestedBathrooms =
    count(
      requirements,
      "bathrooms",
      2
    );

  if (
    floors.length !==
    floorCount
  ) {
    errors.push(
      "The generated house does not contain the requested number of floors."
    );
  }

  const generatedBedrooms =
    floors.reduce(
      (sum, floor) =>
        sum +
        (
          floor.rooms ||
          []
        ).filter(
          (room) =>
            room.type ===
            "bedroom"
        ).length,
      0
    );

  const generatedBathrooms =
    floors.reduce(
      (sum, floor) =>
        sum +
        (
          floor.rooms ||
          []
        ).filter(
          (room) =>
            room.type ===
            "bathroom"
        ).length,
      0
    );

  if (
    generatedBedrooms !==
    requestedBedrooms
  ) {
    errors.push(
      `Bedroom count mismatch: requested ${requestedBedrooms}, generated ${generatedBedrooms}.`
    );
  }

  if (
    generatedBathrooms !==
    requestedBathrooms
  ) {
    errors.push(
      `Bathroom count mismatch: requested ${requestedBathrooms}, generated ${generatedBathrooms}.`
    );
  }

  floors.forEach(
    (floor) => {
      if (
        !floor?.validation
          ?.valid
      ) {
        errors.push(
          `${
            floor.floorLabel ||
            "Floor"
          } contains a floor-level validation issue.`
        );
      }

      if (
        floor.verticalCore
          ?.status !==
          "planned" &&
        floor.number <
          floorCount
      ) {
        errors.push(
          `${
            floor.floorLabel ||
            "Floor"
          } does not have a collision-free staircase zone.`
        );
      }
    }
  );

  if (
    concept.serviceStack
      ?.status ===
    "planned"
  ) {
    const distances =
      concept.serviceStack.rooms.map(
        (item) =>
          item.distanceToStack
      );

    if (
      distances.some(
        (distance) =>
          distance >
          Math.max(
            plotSafe(
              requirements
            ).width,
            plotSafe(
              requirements
            ).length
          )
      )
    ) {
      errors.push(
        "One or more bathrooms are too far from the shared service-stack zone for efficient vertical plumbing planning."
      );
    }
  }

  return [
    ...new Set(errors),
  ];
}

function plotSafe(
  requirements
) {
  return getPlot(
    requirements
  );
}

function generateFloorConcepts(
  requirements,
  aiAnalysis,
  floorIndex,
  floorCount
) {
  const floorReq =
    floorRequirements(
      requirements,
      floorIndex,
      floorCount
    );

  const generated =
    generateAllConcepts(
      floorReq,
      aiAnalysis
    );

  const concepts =
    Array.isArray(generated)
      ? generated
      : generated?.concepts ||
        [];

  const plot =
    getPlot(
      floorReq
    );

  return concepts.map(
    (concept) => {
      const verticalCore =
        createVerticalCore(
          plot,
          concept.rooms || [],
          floorIndex
        );

      return {
        ...concept,

        floorIndex,

        floorNumber:
          floorIndex + 1,

        floorLabel:
          floorLabel(
            floorIndex
          ),

        isGroundFloor:
          floorIndex === 0,

        isUpperFloor:
          floorIndex > 0,

        verticalCore,

        planningProgram: {
          bedrooms:
            (
              concept.rooms ||
              []
            ).filter(
              (room) =>
                room.type ===
                "bedroom"
            ).length,

          bathrooms:
            (
              concept.rooms ||
              []
            ).filter(
              (room) =>
                room.type ===
                "bathroom"
            ).length,

          sharedSpaces:
            (
              concept.rooms ||
              []
            ).filter(
              (room) =>
                [
                  "living",
                  "dining",
                  "kitchen",
                  "pooja",
                ].includes(
                  room.type
                )
            ).length,
        },
      };
    }
  );
}

/**
 * Generates a complete conceptual house for 1–3 floors.
 *
 * The existing generateAllConcepts() API is intentionally unchanged.
 * This function is additive and is the Phase 1 house-level planning API.
 */
export function generateMultiFloorHouse(
  requirements = {},
  aiAnalysis = null,
  floorCount = 1
) {
  const safeFloorCount =
    Math.min(
      MULTI_FLOOR_MAX,
      Math.max(
        1,
        Math.round(
          n(
            floorCount,
            1
          )
        )
      )
    );

  const floors =
    Array.from(
      {
        length:
          safeFloorCount,
      },
      (_, floorIndex) => {
        const concepts =
          generateFloorConcepts(
            requirements,
            aiAnalysis,
            floorIndex,
            safeFloorCount
          );

        const firstConcept =
          concepts[0] ||
          null;

        return {
          level:
            floorIndex,

          number:
            floorIndex + 1,

          label:
            floorLabel(
              floorIndex
            ),

          concepts,

          conceptIds:
            concepts.map(
              (concept) =>
                concept.id
            ),

          planningProgram:
            firstConcept
              ?.planningProgram || {
              bedrooms: 0,
              bathrooms: 0,
              sharedSpaces: 0,
            },
        };
      }
    );

  const conceptIds = [
    "family",
    "private",
    "spacious",
  ];

  const wholeHouseConcepts =
    conceptIds.map(
      (conceptId) => {
        const conceptFloors =
          floors.map(
            (floor) =>
              floor.concepts.find(
                (concept) =>
                  concept.id ===
                  conceptId
              ) || null
          );

        const sharedVerticalCores =
          createSharedVerticalCores(
            getPlot(
              requirements
            ),
            conceptFloors,
            safeFloorCount
          );

        conceptFloors.forEach(
          (
            floor,
            index
          ) => {
            if (floor) {
              floor.verticalCore =
                sharedVerticalCores[
                  index
                ];
            }
          }
        );

        const serviceStack =
          chooseServiceStack(
            getPlot(
              requirements
            ),
            conceptFloors
              .filter(Boolean)
              .map(
                (
                  concept,
                  index
                ) => ({
                  ...concept,
                  floorNumber:
                    index + 1,
                })
              )
          );

        const totalBuiltArea =
          conceptFloors.reduce(
            (
              sum,
              concept
            ) =>
              sum +
              Number(
                concept
                  ?.planningMetrics
                  ?.builtArea ||
                  0
              ),
            0
          );

        const houseConcept = {
          id: conceptId,

          title:
            conceptFloors[0]
              ?.strategyProfile
              ?.title ||
            conceptId,

          strategy:
            conceptId,

          floors:
            conceptFloors,

          floorCount:
            safeFloorCount,

          totalBuiltArea:
            round(
              totalBuiltArea
            ),

          serviceStack,

          planningNotes: [
            "Each requested floor is generated as a complete conceptual residential arrangement.",

            "Bedroom and bathroom totals are distributed across floors without inventing extra required rooms.",

            "A dedicated staircase zone is checked against every floor's room geometry.",

            "Bathrooms are evaluated against a shared vertical service zone for future plumbing coordination.",

            "Vastu remains a shared planning constraint; the three concepts remain differentiated by spatial strategy.",
          ],
        };

        const validationErrors =
          validateHouseConcept(
            houseConcept,
            requirements,
            safeFloorCount
          );

        return {
          ...houseConcept,

          validation: {
            valid:
              validationErrors.length ===
              0,

            errors:
              validationErrors,
          },
        };
      }
    );

  return {
    type:
      "mynest-multi-floor-house",

    floorCount:
      safeFloorCount,

    plot:
      getPlot(
        requirements
      ),

    floors,

    concepts:
      wholeHouseConcepts,

    selectedConceptId:
      null,

    validation: {
      valid:
        wholeHouseConcepts.every(
          (concept) =>
            concept.validation
              .valid
        ),

      validConceptCount:
        wholeHouseConcepts.filter(
          (concept) =>
            concept.validation
              .valid
        ).length,

      totalConceptCount:
        wholeHouseConcepts.length,

      errors:
        wholeHouseConcepts.flatMap(
          (concept) =>
            concept.validation
              .errors
        ),
    },
  };
}

export default generateAllConcepts;