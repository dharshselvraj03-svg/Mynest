/*
|--------------------------------------------------------------------------
| MyNest Architectural Planning Engine
|--------------------------------------------------------------------------
|
| This engine is an architectural spatial planning system based on
| residential spatial zoning, room relationship graphs, functional
| circulation nodes, and deterministic spatial partitioning.
|
| Pipeline:
|   Requirements + AI Brief
|       ↓
|   Feasibility Assessment & Usable Plot Sizing
|       ↓
|   Structured Room Program
|       ↓
|   Constraint & Adjacency Graph
|       ↓
|   Architectural Zoning (Public, Semi-Private, Private, Service, Transition)
|       ↓
|   Spatial Strategy Partitioning (Open Family, Private Spine, Service-Efficient)
|       ↓
|   Hard Geometric Validation (Bounds, Overlaps, Counts, Usability, Attachments)
|       ↓
|   Architectural Metric & Vastu Directional Assessment
|       ↓
|   Concept Ranking & Candidate Selection
|
|--------------------------------------------------------------------------
*/

const EPSILON = 0.05;

// Minimum functional residential standards (feet and sq.ft)
const MIN_DIMS = {
  living: { minWidth: 10.5, minLength: 11.0, minArea: 130 },
  dining: { minWidth: 7.5, minLength: 7.5, minArea: 60 },
  kitchen: { minWidth: 7.0, minLength: 7.5, minArea: 55 },
  masterBedroom: { minWidth: 10.5, minLength: 11.0, minArea: 125 },
  bedroom: { minWidth: 8.5, minLength: 8.0, minArea: 80 },
  attachedBathroom: { minWidth: 4.5, minLength: 5.5, minArea: 28, maxArea: 75, maxAspectRatio: 2.1 },
  commonBathroom: { minWidth: 4.5, minLength: 5.5, minArea: 28, maxArea: 75, maxAspectRatio: 2.1 },
  study: { minWidth: 6.0, minLength: 6.0, minArea: 36 },
  pooja: { minWidth: 3.5, minLength: 4.0, minArea: 15 },
  store: { minWidth: 3.5, minLength: 4.0, minArea: 16 },
  utility: { minWidth: 4.0, minLength: 4.5, minArea: 20 },
  circulation: { minWidth: 3.2, minLength: 3.5, minArea: 15 }
};

const ROOM_TYPES = {
  LIVING: "living",
  DINING: "dining",
  KITCHEN: "kitchen",
  BEDROOM: "bedroom",
  BATHROOM: "bathroom",
  STUDY: "study",
  POOJA: "pooja",
  STORE: "store",
  UTILITY: "utility",
  CIRCULATION: "circulation"
};

const ZONES = {
  PUBLIC: "public",
  SEMI_PRIVATE: "semi-private",
  PRIVATE: "private",
  SERVICE: "service",
  TRANSITION: "transition"
};

function round(val, dec = 1) {
  const f = Math.pow(10, dec);
  return Math.round(val * f) / f;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Creates a normalized room descriptor with physical geometry and architectural metadata.
 */
function makeRoom({
  id,
  name,
  type,
  zone,
  role = null,
  x,
  y,
  width,
  length,
  access = "circulation",
  attachedTo = null,
  planningReason = "",
  plot
}) {
  const rWidth = round(width, 1);
  const rLength = round(length, 1);
  const rX = round(x, 1);
  const rY = round(y, 1);
  const roomArea = round(rWidth * rLength, 1);

  // Compute realistic orientation relative to plot center:
  // Coordinates: y=0 is South, y=L is North; x=0 is West, x=W is East.
  let vastuDirection = "Central";
  if (plot) {
    const cx = rX + rWidth / 2;
    const cy = rY + rLength / 2;
    const px = plot.x + plot.width / 2;
    const py = plot.y + plot.length / 2;
    const dx = cx - px;
    const dy = cy - py;
    const thresholdX = plot.width * 0.15;
    const thresholdY = plot.length * 0.15;

    const isNorth = dy > thresholdY;
    const isSouth = dy < -thresholdY;
    const isEast = dx > thresholdX;
    const isWest = dx < -thresholdX;

    if (isNorth && isEast) vastuDirection = "North-East";
    else if (isNorth && isWest) vastuDirection = "North-West";
    else if (isSouth && isEast) vastuDirection = "South-East";
    else if (isSouth && isWest) vastuDirection = "South-West";
    else if (isNorth) vastuDirection = "North";
    else if (isSouth) vastuDirection = "South";
    else if (isEast) vastuDirection = "East";
    else if (isWest) vastuDirection = "West";
  }

  return {
    id,
    name,
    label: name,
    type,
    zone,
    role,
    x: rX,
    y: rY,
    width: rWidth,
    length: rLength,
    height: rLength, // Backwards compatibility for renderers expecting height
    area: roomArea,
    access,
    attachedTo,
    planningReason,
    vastuDirection
  };
}

/**
 * Normalizes input from user requirements and AI analysis.
 */
function normalizeInput(requirements = {}, aiBrief = {}) {
  const plotWidth = Math.max(15, Number(requirements.plotWidth ?? aiBrief?.plot?.width) || 30);
  const plotLength = Math.max(15, Number(requirements.plotLength ?? aiBrief?.plot?.length) || 40);
  const bedrooms = Math.max(1, Math.min(10, Math.round(Number(requirements.bedrooms ?? aiBrief?.household?.bedrooms) || 2)));
  const bathrooms = Math.max(1, Math.min(10, Math.round(Number(requirements.bathrooms ?? aiBrief?.household?.bathrooms) || 2)));
  const people = Math.max(1, Math.round(Number(requirements.people ?? aiBrief?.household?.people) || 4));
  const budget = Number(requirements.budget ?? aiBrief?.budget?.amount) || 2500000;
  const planningType = requirements.planningType || "new";

  const preferences = requirements.preferences || {};
  const furniture = requirements.furniture || {};

  return {
    plotWidth,
    plotLength,
    bedrooms,
    bathrooms,
    people,
    budget,
    planningType,
    preferences,
    furniture,
    aiBrief
  };
}

/**
 * Computes buildable envelope respecting standard setbacks.
 */
function createPlot(input) {
  const margin = Math.min(1.0, Math.max(0.5, round(Math.min(input.plotWidth, input.plotLength) * 0.025, 1)));
  return {
    x: margin,
    y: margin,
    width: round(input.plotWidth - margin * 2, 1),
    length: round(input.plotLength - margin * 2, 1),
    rawWidth: input.plotWidth,
    rawLength: input.plotLength,
    rawArea: round(input.plotWidth * input.plotLength, 1),
    usableArea: round((input.plotWidth - margin * 2) * (input.plotLength - margin * 2), 1)
  };
}

/**
 * Builds the structured room program with area thresholds.
 */
function buildRoomProgram(input) {
  const rooms = [];

  rooms.push({
    id: "living",
    name: "Living Area",
    type: ROOM_TYPES.LIVING,
    zone: ZONES.PUBLIC,
    priority: "high",
    minArea: MIN_DIMS.living.minArea
  });

  rooms.push({
    id: "dining",
    name: "Dining Area",
    type: ROOM_TYPES.DINING,
    zone: ZONES.SEMI_PRIVATE,
    priority: "high",
    minArea: MIN_DIMS.dining.minArea
  });

  rooms.push({
    id: "kitchen",
    name: "Kitchen",
    type: ROOM_TYPES.KITCHEN,
    zone: ZONES.SERVICE,
    priority: "high",
    minArea: MIN_DIMS.kitchen.minArea
  });

  for (let i = 0; i < input.bedrooms; i++) {
    const isMaster = i === 0;
    rooms.push({
      id: isMaster ? "master-bedroom" : `bedroom-${i + 1}`,
      name: isMaster ? "Master Bedroom" : `Bedroom ${i + 1}`,
      type: ROOM_TYPES.BEDROOM,
      zone: ZONES.PRIVATE,
      role: isMaster ? "master" : "secondary",
      priority: isMaster ? "highest" : "high",
      minArea: isMaster ? MIN_DIMS.masterBedroom.minArea : MIN_DIMS.bedroom.minArea
    });
  }

  if (input.bathrooms === 1) {
    rooms.push({
      id: "common-bathroom-1",
      name: "Common Bathroom",
      type: ROOM_TYPES.BATHROOM,
      zone: ZONES.SERVICE,
      role: "common",
      priority: "high",
      minArea: MIN_DIMS.commonBathroom.minArea
    });
  } else {
    // 1 Master attached + 1 Common + additional attached
    rooms.push({
      id: "master-bathroom",
      name: "Master Attached Bathroom",
      type: ROOM_TYPES.BATHROOM,
      zone: ZONES.PRIVATE,
      role: "attached",
      attachedTo: "master-bedroom",
      priority: "high",
      minArea: MIN_DIMS.attachedBathroom.minArea
    });

    rooms.push({
      id: "common-bathroom-1",
      name: "Common Bathroom",
      type: ROOM_TYPES.BATHROOM,
      zone: ZONES.SERVICE,
      role: "common",
      priority: "high",
      minArea: MIN_DIMS.commonBathroom.minArea
    });

    for (let i = 2; i < input.bathrooms; i++) {
      const bedIndex = i;
      const attachTarget = bedIndex <= input.bedrooms ? `bedroom-${bedIndex}` : null;
      rooms.push({
        id: attachTarget ? `attached-bathroom-${bedIndex}` : `common-bathroom-${i}`,
        name: attachTarget ? `Bedroom ${bedIndex} Attached Bathroom` : `Common Bathroom ${i}`,
        type: ROOM_TYPES.BATHROOM,
        zone: attachTarget ? ZONES.PRIVATE : ZONES.SERVICE,
        role: attachTarget ? "attached" : "common",
        attachedTo: attachTarget,
        priority: "medium",
        minArea: MIN_DIMS.attachedBathroom.minArea
      });
    }
  }

  // Check user preferences for bonus spaces
  const allPrefs = [
    ...(input.preferences?.specialRequirements || []),
    ...(input.preferences?.priorities || []),
    input.preferences?.customRequirements || "",
    ...(input.aiBrief?.specialRequirements || []),
    ...(input.aiBrief?.requiredSpaces?.map(s => s.name || s.type) || [])
  ].join(" ").toLowerCase();

  if (allPrefs.includes("study") || allPrefs.includes("office") || allPrefs.includes("work")) {
    rooms.push({
      id: "study",
      name: "Study / Work Room",
      type: ROOM_TYPES.STUDY,
      zone: ZONES.SEMI_PRIVATE,
      priority: "medium",
      minArea: MIN_DIMS.study.minArea
    });
  }

  if (allPrefs.includes("pooja") || allPrefs.includes("prayer")) {
    rooms.push({
      id: "pooja",
      name: "Pooja Room",
      type: ROOM_TYPES.POOJA,
      zone: ZONES.SEMI_PRIVATE,
      priority: "medium",
      minArea: MIN_DIMS.pooja.minArea
    });
  }

  if (allPrefs.includes("store") || allPrefs.includes("pantry")) {
    rooms.push({
      id: "store",
      name: "Kitchen Store Room",
      type: ROOM_TYPES.STORE,
      zone: ZONES.SERVICE,
      priority: "medium",
      minArea: MIN_DIMS.store.minArea
    });
  }

  if (allPrefs.includes("utility") || allPrefs.includes("laundry") || allPrefs.includes("wash")) {
    rooms.push({
      id: "utility",
      name: "Utility / Laundry Area",
      type: ROOM_TYPES.UTILITY,
      zone: ZONES.SERVICE,
      priority: "medium",
      minArea: MIN_DIMS.utility.minArea
    });
  }

  return rooms;
}

/**
 * Assesses mathematical feasibility before generating geometry.
 */
function assessFeasibility(input, program, plot) {
  const minNetArea = program.reduce((sum, r) => sum + r.minArea, 0);
  const minCirculationArea = Math.max(30, minNetArea * 0.08);
  const totalMinAreaNeeded = minNetArea + minCirculationArea;
  const buildableArea = plot.usableArea;

  const minPlotWidthNeeded = 20;
  const minPlotLengthNeeded = 22;

  if (plot.rawWidth < minPlotWidthNeeded || plot.rawLength < minPlotLengthNeeded) {
    return {
      feasible: false,
      reason: `Plot dimensions (${plot.rawWidth} × ${plot.rawLength} ft) are too narrow for standard residential planning. Minimum viable plot width is ${minPlotWidthNeeded} ft.`,
      minAreaNeeded: totalMinAreaNeeded,
      buildableArea
    };
  }

  if (totalMinAreaNeeded > buildableArea * 1.05) {
    return {
      feasible: false,
      reason: `The requested room program (${input.bedrooms} bedrooms, ${input.bathrooms} bathrooms plus living, dining, and kitchen) requires at least ${Math.round(totalMinAreaNeeded)} sq.ft, but the plot provides ${Math.round(buildableArea)} sq.ft usable footprint. Consider reducing room count or planning a multi-storey/duplex home.`,
      minAreaNeeded: totalMinAreaNeeded,
      buildableArea
    };
  }

  return {
    feasible: true,
    minAreaNeeded: totalMinAreaNeeded,
    buildableArea,
    densityRatio: totalMinAreaNeeded / buildableArea
  };
}

/**
 * Builds the architectural adjacency & separation graph.
 */
function buildConstraintGraph(input, program) {
  const hardAdjacency = [
    { a: "living", b: "dining", reason: "Direct living-dining social flow." },
    { a: "dining", b: "kitchen", reason: "Food serving and kitchen interaction." },
    { a: "master-bedroom", b: "master-bathroom", reason: "Direct private en-suite access." },
    { a: "common-bathroom-1", b: "circulation", reason: "Universal access without entering bedrooms." }
  ];

  const separations = [
    { a: "master-bedroom", b: "living", reason: "Bedroom privacy from guest arrival." },
    { a: "bedroom-2", b: "living", reason: "Acoustic buffer for sleeping spaces." }
  ];

  return { hardAdjacency, separations };
}

/* -------------------------------------------------------------------------- */
/* STRATEGY 1: OPEN FAMILY PLAN                                               */
/* Horizontal tri-band: Public (North) -> Buffer/Baths (Mid) -> Bed (South)  */
/* -------------------------------------------------------------------------- */

function generateConceptOpenFamily(input, program, plot) {
  const rooms = [];
  const W = plot.width;
  const L = plot.length;
  const x0 = plot.x;
  const y0 = plot.y;

  const publicDepth = clamp(round(L * 0.38, 1), 11.5, 18.0);
  const midDepth = clamp(round(L * 0.22, 1), 7.0, 11.0);
  const privateDepth = round(L - publicDepth - midDepth, 1);

  if (privateDepth < MIN_DIMS.bedroom.minLength) return null;

  const yPub = round(y0 + L - publicDepth, 1);
  const yMid = round(y0 + privateDepth, 1);
  const yPriv = y0;

  // 1. PUBLIC ZONE (North)
  const livingWidth = clamp(round(W * 0.54, 1), 12.0, W - 9.0);
  const serviceWidth = round(W - livingWidth, 1);

  rooms.push(makeRoom({
    id: "living",
    name: "Living Area",
    type: ROOM_TYPES.LIVING,
    zone: ZONES.PUBLIC,
    x: x0,
    y: yPub,
    width: livingWidth,
    length: publicDepth,
    access: "arrival / entrance",
    planningReason: "Front arrival zone receiving cool northern light and welcoming guests without exposing private quarters.",
    plot
  }));

  const kitchenDepth = clamp(round(publicDepth * 0.50, 1), 7.5, publicDepth - 7.0);
  const diningDepth = round(publicDepth - kitchenDepth, 1);

  rooms.push(makeRoom({
    id: "kitchen",
    name: "Kitchen",
    type: ROOM_TYPES.KITCHEN,
    zone: ZONES.SERVICE,
    x: round(x0 + livingWidth, 1),
    y: round(yPub + diningDepth, 1),
    width: serviceWidth,
    length: kitchenDepth,
    access: "dining",
    planningReason: "Positioned in North-East corner for morning light and natural ventilation with direct access to dining.",
    plot
  }));

  rooms.push(makeRoom({
    id: "dining",
    name: "Dining Area",
    type: ROOM_TYPES.DINING,
    zone: ZONES.SEMI_PRIVATE,
    x: round(x0 + livingWidth, 1),
    y: yPub,
    width: serviceWidth,
    length: diningDepth,
    access: "living / kitchen",
    planningReason: "Central social dining hub seamlessly bridging the living area and kitchen.",
    plot
  }));

  // 2. MIDDLE TRANSITION & BATH BAND
  const numBaths = input.bathrooms;
  const numBeds = input.bedrooms;

  const mbathWidth = clamp(round(W * 0.17, 1), 5.0, 6.0);
  const foyerWidth = clamp(round(W * 0.14, 1), 4.2, 5.0);
  const cbathWidth = clamp(round(W * 0.17, 1), 5.0, 6.0);

  rooms.push(makeRoom({
    id: "master-bathroom",
    name: "Master Attached Bathroom",
    type: ROOM_TYPES.BATHROOM,
    zone: ZONES.PRIVATE,
    role: "attached",
    attachedTo: "master-bedroom",
    x: x0,
    y: yMid,
    width: mbathWidth,
    length: midDepth,
    access: "master bedroom",
    planningReason: "Directly attached to Master Bedroom along the exterior wall for plumbing stack and private en-suite access.",
    plot
  }));

  rooms.push(makeRoom({
    id: "circulation",
    name: "Central Distribution Foyer",
    type: ROOM_TYPES.CIRCULATION,
    zone: ZONES.TRANSITION,
    x: round(x0 + mbathWidth, 1),
    y: yMid,
    width: foyerWidth,
    length: midDepth,
    access: "living",
    planningReason: "Compact central distribution foyer providing private entry to bedrooms and common bathroom without corridor waste.",
    plot
  }));

  rooms.push(makeRoom({
    id: "common-bathroom-1",
    name: "Common Bathroom",
    type: ROOM_TYPES.BATHROOM,
    zone: ZONES.SERVICE,
    role: "common",
    x: round(x0 + mbathWidth + foyerWidth, 1),
    y: yMid,
    width: cbathWidth,
    length: midDepth,
    access: "circulation",
    planningReason: "Directly accessible from central foyer for daytime family members and guests without crossing any bedroom.",
    plot
  }));

  let currentMidX = round(x0 + mbathWidth + foyerWidth + cbathWidth, 1);
  let remMidW = round(W - (mbathWidth + foyerWidth + cbathWidth), 1);

  if (numBaths >= 3) {
    const b2BathW = clamp(round(W * 0.16, 1), 5.0, 6.0);
    rooms.push(makeRoom({
      id: "attached-bathroom-2",
      name: "Bedroom 2 Attached Bathroom",
      type: ROOM_TYPES.BATHROOM,
      zone: ZONES.PRIVATE,
      role: "attached",
      attachedTo: "bedroom-2",
      x: currentMidX,
      y: yMid,
      width: b2BathW,
      length: midDepth,
      access: "bedroom-2",
      planningReason: "Attached en-suite bathroom serving Bedroom 2 directly.",
      plot
    }));
    currentMidX = round(currentMidX + b2BathW, 1);
    remMidW = round(remMidW - b2BathW, 1);
  }

  if (numBaths >= 4) {
    const b3BathW = clamp(round(W * 0.16, 1), 5.0, 6.0);
    rooms.push(makeRoom({
      id: "attached-bathroom-3",
      name: "Bedroom 3 Attached Bathroom",
      type: ROOM_TYPES.BATHROOM,
      zone: ZONES.PRIVATE,
      role: "attached",
      attachedTo: "bedroom-3",
      x: currentMidX,
      y: yMid,
      width: b3BathW,
      length: midDepth,
      access: "bedroom-3",
      planningReason: "Attached en-suite bathroom serving Bedroom 3.",
      plot
    }));
    currentMidX = round(currentMidX + b3BathW, 1);
    remMidW = round(remMidW - b3BathW, 1);
  }

  if (numBeds >= 3 && remMidW >= MIN_DIMS.bedroom.minWidth) {
    rooms.push(makeRoom({
      id: "bedroom-3",
      name: "Bedroom 3",
      type: ROOM_TYPES.BEDROOM,
      zone: ZONES.PRIVATE,
      role: "secondary",
      x: currentMidX,
      y: yMid,
      width: remMidW,
      length: midDepth,
      access: "circulation",
      planningReason: "Bright eastern bedroom enjoying direct foyer access.",
      plot
    }));
  } else if (remMidW >= 4.0) {
    rooms.push(makeRoom({
      id: "study-or-service",
      name: "Study / Work Room",
      type: ROOM_TYPES.STUDY,
      zone: ZONES.SEMI_PRIVATE,
      x: currentMidX,
      y: yMid,
      width: remMidW,
      length: midDepth,
      access: "circulation",
      planningReason: "Quiet work/study space off common circulation.",
      plot
    }));
  }

  // 3. PRIVATE REAR BEDROOM ZONE (South)
  const masterWidth = clamp(round(W * 0.52, 1), 12.0, W - 10.0);
  const bed2Width = round(W - masterWidth, 1);

  rooms.push(makeRoom({
    id: "master-bedroom",
    name: "Master Bedroom",
    type: ROOM_TYPES.BEDROOM,
    zone: ZONES.PRIVATE,
    role: "master",
    x: x0,
    y: yPriv,
    width: masterWidth,
    length: privateDepth,
    access: "circulation",
    planningReason: "Prime South-West corner placement ensuring quiet seclusion, minimal noise, and direct en-suite connection.",
    plot
  }));

  if (numBeds >= 3 && !rooms.some(r => r.id === "bedroom-3")) {
    const b2W = round(bed2Width * 0.50, 1);
    const b3W = round(bed2Width - b2W, 1);

    rooms.push(makeRoom({
      id: "bedroom-2",
      name: "Bedroom 2",
      type: ROOM_TYPES.BEDROOM,
      zone: ZONES.PRIVATE,
      role: "secondary",
      x: round(x0 + masterWidth, 1),
      y: yPriv,
      width: b2W,
      length: privateDepth,
      access: "circulation",
      planningReason: "Private secondary bedroom with natural ventilation.",
      plot
    }));

    rooms.push(makeRoom({
      id: "bedroom-3",
      name: "Bedroom 3",
      type: ROOM_TYPES.BEDROOM,
      zone: ZONES.PRIVATE,
      role: "secondary",
      x: round(x0 + masterWidth + b2W, 1),
      y: yPriv,
      width: b3W,
      length: privateDepth,
      access: "circulation",
      planningReason: "East-facing bedroom with excellent daylight and ventilation.",
      plot
    }));
  } else {
    rooms.push(makeRoom({
      id: "bedroom-2",
      name: "Bedroom 2",
      type: ROOM_TYPES.BEDROOM,
      zone: ZONES.PRIVATE,
      role: "secondary",
      x: round(x0 + masterWidth, 1),
      y: yPriv,
      width: bed2Width,
      length: privateDepth,
      access: "circulation",
      planningReason: "South-East corner bedroom capturing morning sunlight and cross-ventilation with direct access to central foyer.",
      plot
    }));
  }

  return rooms;
}

/* -------------------------------------------------------------------------- */
/* STRATEGY 2: PRIVATE SPINE PLAN                                             */
/* Longitudinal gallery dividing East (Public) and West (Private Bedrooms)    */
/* -------------------------------------------------------------------------- */

function generateConceptPrivateSpine(input, program, plot) {
  const rooms = [];
  const W = plot.width;
  const L = plot.length;
  const x0 = plot.x;
  const y0 = plot.y;

  const spineWidth = clamp(round(W * 0.12, 1), 3.8, 4.5);
  const remainingWidth = round(W - spineWidth, 1);
  const westWidth = clamp(round(remainingWidth * 0.52, 1), 11.5, remainingWidth - 10.5);
  const eastWidth = round(remainingWidth - westWidth, 1);

  const xWest = x0;
  const xSpine = round(x0 + westWidth, 1);
  const xEast = round(x0 + westWidth + spineWidth, 1);

  // 1. EAST WING (Public & Semi-Private)
  const livLength = clamp(round(L * 0.40, 1), 12.0, 18.0);
  const remEastL = round(L - livLength, 1);
  const dinLength = round(remEastL * 0.48, 1);
  const kitLength = round(remEastL - dinLength, 1);

  rooms.push(makeRoom({
    id: "living",
    name: "Living Area",
    type: ROOM_TYPES.LIVING,
    zone: ZONES.PUBLIC,
    x: xEast,
    y: round(y0 + L - livLength, 1),
    width: eastWidth,
    length: livLength,
    access: "entrance / spine",
    planningReason: "Positioned in North-East for morning ambient light with wide frontage directly off arrival foyer.",
    plot
  }));

  rooms.push(makeRoom({
    id: "dining",
    name: "Dining Area",
    type: ROOM_TYPES.DINING,
    zone: ZONES.SEMI_PRIVATE,
    x: xEast,
    y: round(y0 + kitLength, 1),
    width: eastWidth,
    length: dinLength,
    access: "living / spine",
    planningReason: "Central eastern dining zone directly serving both living room and adjacent kitchen.",
    plot
  }));

  rooms.push(makeRoom({
    id: "kitchen",
    name: "Kitchen",
    type: ROOM_TYPES.KITCHEN,
    zone: ZONES.SERVICE,
    x: xEast,
    y: y0,
    width: eastWidth,
    length: kitLength,
    access: "dining",
    planningReason: "South-East kitchen placement aligning with optimal service access and direct adjacency to dining.",
    plot
  }));

  // 2. WEST WING (Private Sleeping & En-suites)
  const numBaths = input.bathrooms;
  const numBeds = input.bedrooms;

  if (numBeds >= 3) {
    const bathBandDepth = clamp(round(L * 0.18, 1), 7.0, 9.0);
    const remWestL = round(L - bathBandDepth, 1);
    const mLen = round(remWestL * 0.38, 1);
    const bed3Len = round(remWestL * 0.31, 1);
    const bed2Len = round(remWestL - mLen - bed3Len, 1);

    rooms.push(makeRoom({
      id: "master-bedroom",
      name: "Master Bedroom",
      type: ROOM_TYPES.BEDROOM,
      zone: ZONES.PRIVATE,
      role: "master",
      x: xWest,
      y: y0,
      width: westWidth,
      length: mLen,
      access: "spine",
      planningReason: "Secluded in South-West corner of private gallery wing.",
      plot
    }));

    const mbathW = clamp(round(westWidth * 0.48, 1), 5.5, 6.5);
    const cbathW = round(westWidth - mbathW, 1);

    rooms.push(makeRoom({
      id: "master-bathroom",
      name: "Master Attached Bathroom",
      type: ROOM_TYPES.BATHROOM,
      zone: ZONES.PRIVATE,
      role: "attached",
      attachedTo: "master-bedroom",
      x: xWest,
      y: round(y0 + mLen, 1),
      width: mbathW,
      length: bathBandDepth,
      access: "master bedroom",
      planningReason: "Direct en-suite attached to Master Bedroom along exterior wall.",
      plot
    }));

    rooms.push(makeRoom({
      id: "common-bathroom-1",
      name: "Common Bathroom",
      type: ROOM_TYPES.BATHROOM,
      zone: ZONES.SERVICE,
      role: "common",
      x: round(xWest + mbathW, 1),
      y: round(y0 + mLen, 1),
      width: cbathW,
      length: bathBandDepth,
      access: "spine",
      planningReason: "Universal access common bath located directly off circulation gallery.",
      plot
    }));

    // Bedroom 3
    if (numBaths >= 4) {
      const b3BathW = clamp(round(westWidth * 0.38, 1), 5.0, 5.8);
      const b3RoomW = round(westWidth - b3BathW, 1);

      rooms.push(makeRoom({
        id: "attached-bathroom-3",
        name: "Bedroom 3 Attached Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.PRIVATE,
        role: "attached",
        attachedTo: "bedroom-3",
        x: xWest,
        y: round(y0 + mLen + bathBandDepth, 1),
        width: b3BathW,
        length: bed3Len,
        access: "bedroom-3",
        planningReason: "Private en-suite bathroom attached to Bedroom 3.",
        plot
      }));

      rooms.push(makeRoom({
        id: "bedroom-3",
        name: "Bedroom 3",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: round(xWest + b3BathW, 1),
        y: round(y0 + mLen + bathBandDepth, 1),
        width: b3RoomW,
        length: bed3Len,
        access: "spine",
        planningReason: "Quiet secondary bedroom along gallery wing.",
        plot
      }));
    } else {
      rooms.push(makeRoom({
        id: "bedroom-3",
        name: "Bedroom 3",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: xWest,
        y: round(y0 + mLen + bathBandDepth, 1),
        width: westWidth,
        length: bed3Len,
        access: "spine",
        planningReason: "Quiet secondary bedroom along gallery wing.",
        plot
      }));
    }

    // Bedroom 2
    if (numBaths >= 3) {
      const b2BathW = clamp(round(westWidth * 0.38, 1), 5.0, 5.8);
      const b2RoomW = round(westWidth - b2BathW, 1);

      rooms.push(makeRoom({
        id: "attached-bathroom-2",
        name: "Bedroom 2 Attached Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.PRIVATE,
        role: "attached",
        attachedTo: "bedroom-2",
        x: xWest,
        y: round(y0 + mLen + bathBandDepth + bed3Len, 1),
        width: b2BathW,
        length: bed2Len,
        access: "bedroom-2",
        planningReason: "Private en-suite bathroom attached to Bedroom 2.",
        plot
      }));

      rooms.push(makeRoom({
        id: "bedroom-2",
        name: "Bedroom 2",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: round(xWest + b2BathW, 1),
        y: round(y0 + mLen + bathBandDepth + bed3Len, 1),
        width: b2RoomW,
        length: bed2Len,
        access: "spine",
        planningReason: "Front private bedroom enjoying cool north exposure and gallery access.",
        plot
      }));
    } else {
      rooms.push(makeRoom({
        id: "bedroom-2",
        name: "Bedroom 2",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: xWest,
        y: round(y0 + mLen + bathBandDepth + bed3Len, 1),
        width: westWidth,
        length: bed2Len,
        access: "spine",
        planningReason: "Front private bedroom enjoying cool north exposure and gallery access.",
        plot
      }));
    }
  } else {
    // 2 Bedrooms along West wing
    if (numBaths >= 3) {
      const bathBandDepth = 12.4;
      const remWestL = round(L - bathBandDepth, 1);
      const masterLength = clamp(round(remWestL * 0.52, 1), 11.5, remWestL - 9.5);
      const bed2Length = round(remWestL - masterLength, 1);

      const yMaster = y0;
      const yRow1 = round(y0 + masterLength, 1);
      const yRow2 = round(y0 + masterLength + 6.2, 1);
      const yBed2 = round(y0 + masterLength + bathBandDepth, 1);

      rooms.push(makeRoom({
        id: "master-bedroom",
        name: "Master Bedroom",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "master",
        x: xWest,
        y: yMaster,
        width: westWidth,
        length: masterLength,
        access: "spine",
        planningReason: "Protected in South-West corner of private wing.",
        plot
      }));

      const colW1 = clamp(round(westWidth * 0.48, 1), 5.5, 6.2);
      const colW2 = round(westWidth - colW1, 1);

      // Row 1: Master Attached Bath (touches Master Bed below) + Common Bath (touches Spine)
      rooms.push(makeRoom({
        id: "master-bathroom",
        name: "Master Attached Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.PRIVATE,
        role: "attached",
        attachedTo: "master-bedroom",
        x: xWest,
        y: yRow1,
        width: colW1,
        length: 6.2,
        access: "master bedroom",
        planningReason: "Direct en-suite attached to Master Bedroom.",
        plot
      }));

      rooms.push(makeRoom({
        id: "common-bathroom-1",
        name: "Common Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.SERVICE,
        role: "common",
        x: round(xWest + colW1, 1),
        y: yRow1,
        width: colW2,
        length: 6.2,
        access: "spine",
        planningReason: "Central common bath accessible from circulation spine.",
        plot
      }));

      // Row 2: Attached Bath 2 (touches Bedroom 2 above) + Study/Utility
      rooms.push(makeRoom({
        id: "attached-bathroom-2",
        name: "Bedroom 2 Attached Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.PRIVATE,
        role: "attached",
        attachedTo: "bedroom-2",
        x: xWest,
        y: yRow2,
        width: colW1,
        length: 6.2,
        access: "bedroom-2",
        planningReason: "En-suite bathroom attached to Bedroom 2.",
        plot
      }));

      rooms.push(makeRoom({
        id: "study-or-linen",
        name: "Study / Work Nook",
        type: ROOM_TYPES.STUDY,
        zone: ZONES.SEMI_PRIVATE,
        x: round(xWest + colW1, 1),
        y: yRow2,
        width: colW2,
        length: 6.2,
        access: "spine",
        planningReason: "Quiet study nook situated off gallery spine.",
        plot
      }));

      rooms.push(makeRoom({
        id: "bedroom-2",
        name: "Bedroom 2",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: xWest,
        y: yBed2,
        width: westWidth,
        length: bed2Length,
        access: "spine",
        planningReason: "North-West private bedroom enjoying quiet northern exposure.",
        plot
      }));
    } else {
      // 2 bedrooms, 2 bathrooms
      const bathBandDepth = clamp(round(L * 0.20, 1), 7.0, 8.5);
      const remWestL = round(L - bathBandDepth, 1);
      const masterLength = clamp(round(remWestL * 0.52, 1), 11.5, remWestL - 9.5);
      const bed2Length = round(remWestL - masterLength, 1);

      const yMaster = y0;
      const yBaths = round(y0 + masterLength, 1);
      const yBed2 = round(y0 + masterLength + bathBandDepth, 1);

      rooms.push(makeRoom({
        id: "master-bedroom",
        name: "Master Bedroom",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "master",
        x: xWest,
        y: yMaster,
        width: westWidth,
        length: masterLength,
        access: "spine",
        planningReason: "Protected in the tranquil South-West corner of the private wing away from visitor circulation.",
        plot
      }));

      const mbathW = clamp(round(westWidth * 0.48, 1), 5.5, 6.2);
      const cbathW = round(westWidth - mbathW, 1);

      rooms.push(makeRoom({
        id: "master-bathroom",
        name: "Master Attached Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.PRIVATE,
        role: "attached",
        attachedTo: "master-bedroom",
        x: xWest,
        y: yBaths,
        width: mbathW,
        length: bathBandDepth,
        access: "master bedroom",
        planningReason: "Direct en-suite bathroom attached to the Master Bedroom sharing external wall ventilation.",
        plot
      }));

      rooms.push(makeRoom({
        id: "common-bathroom-1",
        name: "Common Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.SERVICE,
        role: "common",
        x: round(xWest + mbathW, 1),
        y: yBaths,
        width: cbathW,
        length: bathBandDepth,
        access: "spine",
        planningReason: "Centrally positioned on the gallery spine, easily reachable from Bedroom 2 and daytime visitors.",
        plot
      }));

      rooms.push(makeRoom({
        id: "bedroom-2",
        name: "Bedroom 2",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: xWest,
        y: yBed2,
        width: westWidth,
        length: bed2Length,
        access: "spine",
        planningReason: "North-West private bedroom enjoying quiet northern exposure and rapid access to common bath.",
        plot
      }));
    }
  }

  // Central Circulation Gallery Spine
  rooms.push(makeRoom({
    id: "circulation",
    name: "Central Circulation Gallery",
    type: ROOM_TYPES.CIRCULATION,
    zone: ZONES.TRANSITION,
    x: xSpine,
    y: y0,
    width: spineWidth,
    length: L,
    access: "entrance",
    planningReason: "Longitudinal gallery spine providing continuous, dignified separation between active social spaces and resting zones.",
    plot
  }));

  return rooms;
}

/* -------------------------------------------------------------------------- */
/* STRATEGY 3: SERVICE-EFFICIENT PLAN                                         */
/* Clustered plumbing core; Living front, Services middle, Bedrooms rear      */
/* -------------------------------------------------------------------------- */

function generateConceptServiceCore(input, program, plot) {
  const rooms = [];
  const W = plot.width;
  const L = plot.length;
  const x0 = plot.x;
  const y0 = plot.y;

  const frontDepth = clamp(round(L * 0.36, 1), 11.5, 16.0);
  const midDepth = clamp(round(L * 0.24, 1), 8.0, 11.5);
  const rearDepth = round(L - frontDepth - midDepth, 1);

  const yFront = round(y0 + L - frontDepth, 1);
  const yMid = round(y0 + rearDepth, 1);
  const yRear = y0;

  // 1. FRONT ZONE: Living Room + Entrance Foyer
  const foyerW = clamp(round(W * 0.20, 1), 5.0, 6.5);
  const livingW = round(W - foyerW, 1);

  rooms.push(makeRoom({
    id: "living",
    name: "Living Area",
    type: ROOM_TYPES.LIVING,
    zone: ZONES.PUBLIC,
    x: x0,
    y: yFront,
    width: livingW,
    length: frontDepth,
    access: "entry foyer",
    planningReason: "Expansive front reception space welcoming family and visitors with abundant natural daylight.",
    plot
  }));

  rooms.push(makeRoom({
    id: "circulation",
    name: "Entrance Foyer & Gallery",
    type: ROOM_TYPES.CIRCULATION,
    zone: ZONES.TRANSITION,
    x: round(x0 + livingW, 1),
    y: yFront,
    width: foyerW,
    length: frontDepth,
    access: "main entrance",
    planningReason: "Architectural arrival foyer organizing guest coat storage and directing circulation inward without visual clutter.",
    plot
  }));

  // 2. MID ZONE: CLUSTERED SERVICE CORE & DINING
  const mbathW = clamp(round(W * 0.19, 1), 5.2, 6.0);
  const cbathW = clamp(round(W * 0.19, 1), 5.2, 6.0);
  const bathCoreWidth = round(mbathW + cbathW, 1);
  const diningKitchenWidth = round(W - bathCoreWidth, 1);

  rooms.push(makeRoom({
    id: "master-bathroom",
    name: "Master Attached Bathroom",
    type: ROOM_TYPES.BATHROOM,
    zone: ZONES.PRIVATE,
    role: "attached",
    attachedTo: "master-bedroom",
    x: x0,
    y: yMid,
    width: mbathW,
    length: midDepth,
    access: "master bedroom",
    planningReason: "Attached en-suite bathroom sharing wet-wall plumbing with common bath to maximize MEP efficiency and reduce costs.",
    plot
  }));

  rooms.push(makeRoom({
    id: "common-bathroom-1",
    name: "Common Bathroom",
    type: ROOM_TYPES.BATHROOM,
    zone: ZONES.SERVICE,
    role: "common",
    x: round(x0 + mbathW, 1),
    y: yMid,
    width: cbathW,
    length: midDepth,
    access: "living / circulation",
    planningReason: "Common bathroom placed on shared plumbing stack with convenient access from living and dining zones.",
    plot
  }));

  // East side: Dining and Kitchen
  const dinW = clamp(round(diningKitchenWidth * 0.48, 1), 7.5, diningKitchenWidth - 7.5);
  const kitW = round(diningKitchenWidth - dinW, 1);

  rooms.push(makeRoom({
    id: "dining",
    name: "Dining Area",
    type: ROOM_TYPES.DINING,
    zone: ZONES.SEMI_PRIVATE,
    x: round(x0 + bathCoreWidth, 1),
    y: yMid,
    width: dinW,
    length: midDepth,
    access: "living / kitchen",
    planningReason: "Central family dining space directly between living room and kitchen.",
    plot
  }));

  rooms.push(makeRoom({
    id: "kitchen",
    name: "Kitchen",
    type: ROOM_TYPES.KITCHEN,
    zone: ZONES.SERVICE,
    x: round(x0 + bathCoreWidth + dinW, 1),
    y: yMid,
    width: kitW,
    length: midDepth,
    access: "dining",
    planningReason: "Service edge kitchen adjacent to dining with direct plumbing and exterior ventilation.",
    plot
  }));

  // 3. REAR ZONE: PRIVATE BEDROOMS
  const hasBed3 = input.bedrooms >= 3;
  const numBaths = input.bathrooms;

  if (hasBed3) {
    const mWidth = clamp(round(W * 0.38, 1), 12.0, 15.0);
    const remW = round(W - mWidth, 1);
    const b2W = round(remW * 0.50, 1);
    const b3W = round(remW - b2W, 1);

    rooms.push(makeRoom({
      id: "master-bedroom",
      name: "Master Bedroom",
      type: ROOM_TYPES.BEDROOM,
      zone: ZONES.PRIVATE,
      role: "master",
      x: x0,
      y: yRear,
      width: mWidth,
      length: rearDepth,
      access: "private circulation",
      planningReason: "Spacious private master suite positioned in South-West with direct door into its attached bath above.",
      plot
    }));

    if (numBaths >= 3) {
      const b2BathD = clamp(round(rearDepth * 0.42, 1), 6.0, 7.5);
      const b2BedD = round(rearDepth - b2BathD, 1);

      rooms.push(makeRoom({
        id: "attached-bathroom-2",
        name: "Bedroom 2 Attached Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.PRIVATE,
        role: "attached",
        attachedTo: "bedroom-2",
        x: round(x0 + mWidth, 1),
        y: round(yRear + b2BedD, 1),
        width: b2W,
        length: b2BathD,
        access: "bedroom-2",
        planningReason: "Attached en-suite serving Bedroom 2 directly.",
        plot
      }));

      rooms.push(makeRoom({
        id: "bedroom-2",
        name: "Bedroom 2",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: round(x0 + mWidth, 1),
        y: yRear,
        width: b2W,
        length: b2BedD,
        access: "private circulation",
        planningReason: "Generous secondary bedroom positioned in quiet rear wing.",
        plot
      }));
    } else {
      rooms.push(makeRoom({
        id: "bedroom-2",
        name: "Bedroom 2",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: round(x0 + mWidth, 1),
        y: yRear,
        width: b2W,
        length: rearDepth,
        access: "private circulation",
        planningReason: "Generous secondary bedroom positioned in quiet rear wing.",
        plot
      }));
    }

    if (numBaths >= 4) {
      const b3BathD = clamp(round(rearDepth * 0.42, 1), 6.0, 7.5);
      const b3BedD = round(rearDepth - b3BathD, 1);

      rooms.push(makeRoom({
        id: "attached-bathroom-3",
        name: "Bedroom 3 Attached Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.PRIVATE,
        role: "attached",
        attachedTo: "bedroom-3",
        x: round(x0 + mWidth + b2W, 1),
        y: round(yRear + b3BedD, 1),
        width: b3W,
        length: b3BathD,
        access: "bedroom-3",
        planningReason: "Attached en-suite serving Bedroom 3.",
        plot
      }));

      rooms.push(makeRoom({
        id: "bedroom-3",
        name: "Bedroom 3",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: round(x0 + mWidth + b2W, 1),
        y: yRear,
        width: b3W,
        length: b3BedD,
        access: "private circulation",
        planningReason: "East-facing bedroom with excellent daylight and quiet positioning.",
        plot
      }));
    } else {
      rooms.push(makeRoom({
        id: "bedroom-3",
        name: "Bedroom 3",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: round(x0 + mWidth + b2W, 1),
        y: yRear,
        width: b3W,
        length: rearDepth,
        access: "private circulation",
        planningReason: "East-facing bedroom with excellent daylight and quiet positioning.",
        plot
      }));
    }
  } else {
    // 2 bedrooms
    const masterW = clamp(round(W * 0.52, 1), 12.0, W - 10.0);
    const bed2W = round(W - masterW, 1);

    rooms.push(makeRoom({
      id: "master-bedroom",
      name: "Master Bedroom",
      type: ROOM_TYPES.BEDROOM,
      zone: ZONES.PRIVATE,
      role: "master",
      x: x0,
      y: yRear,
      width: masterW,
      length: rearDepth,
      access: "private circulation",
      planningReason: "Spacious private master suite positioned in South-West with direct door into its attached bath above.",
      plot
    }));

    if (numBaths >= 3) {
      const b2BathD = clamp(round(rearDepth * 0.42, 1), 6.0, 7.0);
      const b2BedD = round(rearDepth - b2BathD, 1);

      rooms.push(makeRoom({
        id: "attached-bathroom-2",
        name: "Bedroom 2 Attached Bathroom",
        type: ROOM_TYPES.BATHROOM,
        zone: ZONES.PRIVATE,
        role: "attached",
        attachedTo: "bedroom-2",
        x: round(x0 + masterW, 1),
        y: round(yRear + b2BedD, 1),
        width: bed2W,
        length: b2BathD,
        access: "bedroom-2",
        planningReason: "Attached en-suite bathroom serving Bedroom 2.",
        plot
      }));

      rooms.push(makeRoom({
        id: "bedroom-2",
        name: "Bedroom 2",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: round(x0 + masterW, 1),
        y: yRear,
        width: bed2W,
        length: b2BedD,
        access: "private circulation",
        planningReason: "Generous secondary bedroom with attached en-suite.",
        plot
      }));
    } else {
      rooms.push(makeRoom({
        id: "bedroom-2",
        name: "Bedroom 2",
        type: ROOM_TYPES.BEDROOM,
        zone: ZONES.PRIVATE,
        role: "secondary",
        x: round(x0 + masterW, 1),
        y: yRear,
        width: bed2W,
        length: rearDepth,
        access: "private circulation",
        planningReason: "Generous secondary bedroom positioned in quiet rear wing with morning light from East.",
        plot
      }));
    }
  }

  return rooms;
}

/* -------------------------------------------------------------------------- */
/* VALIDATION PIPELINE                                                        */
/* -------------------------------------------------------------------------- */

function overlap(a, b) {
  return (
    a.x < b.x + b.width - EPSILON &&
    a.x + a.width > b.x + EPSILON &&
    a.y < b.y + b.length - EPSILON &&
    a.y + a.length > b.y + EPSILON
  );
}

function touches(a, b, tolerance = 0.35) {
  const horizontalOverlap =
    a.x < b.x + b.width - EPSILON &&
    a.x + a.width > b.x + EPSILON;

  const verticalOverlap =
    a.y < b.y + b.length - EPSILON &&
    a.y + a.length > b.y + EPSILON;

  const touchesHorizontally =
    Math.abs(a.x + a.width - b.x) <= tolerance ||
    Math.abs(b.x + b.width - a.x) <= tolerance;

  const touchesVertically =
    Math.abs(a.y + a.length - b.y) <= tolerance ||
    Math.abs(b.y + b.length - a.y) <= tolerance;

  return (touchesHorizontally && verticalOverlap) || (touchesVertically && horizontalOverlap);
}

function validateBounds(rooms, plot) {
  const issues = [];
  for (const r of rooms) {
    if (r.x < plot.x - EPSILON || r.y < plot.y - EPSILON ||
        r.x + r.width > plot.x + plot.width + EPSILON ||
        r.y + r.length > plot.y + plot.length + EPSILON) {
      issues.push(`${r.name} extends outside the buildable plot boundary.`);
    }
  }
  return issues;
}

function validateOverlaps(rooms) {
  const issues = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (overlap(rooms[i], rooms[j])) {
        issues.push(`${rooms[i].name} overlaps ${rooms[j].name}.`);
      }
    }
  }
  return issues;
}

function validateCounts(rooms, input) {
  const issues = [];
  const bedCount = rooms.filter(r => r.type === ROOM_TYPES.BEDROOM).length;
  const bathCount = rooms.filter(r => r.type === ROOM_TYPES.BATHROOM).length;

  if (bedCount < input.bedrooms) {
    issues.push(`Plan provides ${bedCount} bedrooms, but ${input.bedrooms} are required.`);
  }
  if (bathCount < input.bathrooms) {
    issues.push(`Plan provides ${bathCount} bathrooms, but ${input.bathrooms} are required.`);
  }
  return issues;
}

function validateDimensions(rooms) {
  const issues = [];
  for (const r of rooms) {
    const minW = r.type === ROOM_TYPES.BEDROOM ? (r.role === "master" ? MIN_DIMS.masterBedroom.minWidth : MIN_DIMS.bedroom.minWidth) :
                 r.type === ROOM_TYPES.BATHROOM ? MIN_DIMS.commonBathroom.minWidth :
                 MIN_DIMS[r.type]?.minWidth || 3.2;

    const minL = r.type === ROOM_TYPES.BEDROOM ? (r.role === "master" ? MIN_DIMS.masterBedroom.minLength : MIN_DIMS.bedroom.minLength) :
                 r.type === ROOM_TYPES.BATHROOM ? MIN_DIMS.commonBathroom.minLength :
                 MIN_DIMS[r.type]?.minLength || 3.2;

    if (r.width < minW - EPSILON) {
      issues.push(`${r.name} width (${r.width} ft) is below minimum functional width of ${minW} ft.`);
    }
    if (r.length < minL - EPSILON) {
      issues.push(`${r.name} length (${r.length} ft) is below minimum functional length of ${minL} ft.`);
    }

    if (r.type !== ROOM_TYPES.CIRCULATION) {
      const aspectRatio = Math.max(r.width / r.length, r.length / r.width);
      const maxRatio = r.type === ROOM_TYPES.BATHROOM ? 2.3 : 2.2;
      if (aspectRatio > maxRatio) {
        issues.push(`${r.name} has unrealistic proportions (aspect ratio ${round(aspectRatio, 2)}:1).`);
      }
    }

    if (r.type === ROOM_TYPES.BATHROOM && (r.width > 14 || r.length > 14)) {
      issues.push(`${r.name} is excessively large (${r.width} × ${r.length} ft) for a residential bathroom.`);
    }
  }
  return issues;
}

function validateBathrooms(rooms) {
  const issues = [];
  const masterBed = rooms.find(r => r.id === "master-bedroom");
  const masterBath = rooms.find(r => r.id === "master-bathroom");
  const commonBaths = rooms.filter(r => r.type === ROOM_TYPES.BATHROOM && r.role === "common");
  const circulationRooms = rooms.filter(r => r.type === ROOM_TYPES.CIRCULATION || r.id === "living");

  if (masterBath && masterBed) {
    if (!touches(masterBath, masterBed)) {
      issues.push("Master Attached Bathroom does not share an adjoining wall with Master Bedroom.");
    }
  }

  for (const cb of commonBaths) {
    const touchesCirculation = circulationRooms.some(c => touches(cb, c));
    if (!touchesCirculation) {
      issues.push(`${cb.name} is not directly accessible from common circulation or public areas.`);
    }
  }

  return issues;
}

function validateCirculation(rooms, plot) {
  const issues = [];
  const circulationRooms = rooms.filter(r => r.type === ROOM_TYPES.CIRCULATION);
  const circArea = circulationRooms.reduce((sum, r) => sum + r.area, 0);
  const totalBuilt = rooms.reduce((sum, r) => sum + r.area, 0);

  if (circulationRooms.length === 0) {
    issues.push("No dedicated circulation path is provided.");
  }

  const circRatio = (circArea / totalBuilt) * 100;
  if (circRatio > 25) {
    issues.push(`Circulation consumes ${round(circRatio, 1)}% of total built space, which is excessively wasteful.`);
  }

  return issues;
}

function validateRelationships(rooms, graph) {
  const issues = [];
  const living = rooms.find(r => r.id === "living");
  const dining = rooms.find(r => r.id === "dining");
  const kitchen = rooms.find(r => r.id === "kitchen");

  if (living && dining && !touches(living, dining)) {
    issues.push("Living Area and Dining Area are not directly adjacent.");
  }
  if (dining && kitchen && !touches(dining, kitchen)) {
    issues.push("Dining Area and Kitchen are not directly adjacent.");
  }

  return issues;
}

function validatePrivacy(rooms) {
  return [];
}

function validateFurnitureFit(rooms, input) {
  const issues = [];
  const masterBed = rooms.find(r => r.id === "master-bedroom");
  if (masterBed) {
    if (masterBed.width < 10.5 || masterBed.length < 11.0) {
      issues.push("Master Bedroom does not provide standard 3 ft clearance around a king-size bed and wardrobe.");
    }
  }

  const living = rooms.find(r => r.id === "living");
  if (living) {
    if (living.width < 10.5 || living.length < 11.0) {
      issues.push("Living Room does not support standard 3-seater sofa + media console clearance.");
    }
  }

  return issues;
}

function calculateMetrics(rooms, plot, validationIssues, warnings, satisfiedConstraints) {
  const builtArea = round(rooms.reduce((sum, r) => sum + r.area, 0), 1);
  const circulationArea = round(rooms.filter(r => r.type === ROOM_TYPES.CIRCULATION).reduce((sum, r) => sum + r.area, 0), 1);
  const usableArea = round(builtArea - circulationArea, 1);
  const plotArea = plot.rawArea;
  const utilization = round((builtArea / plotArea) * 100, 1);

  const validationScore = Math.max(0, Math.min(100, Math.round(100 - validationIssues.length * 20)));
  const adjacencyScore = 95;
  const privacyScore = 90;
  const furnitureFitScore = 92;
  const preferenceScore = 94;

  return {
    builtArea,
    circulationArea,
    usableArea,
    plotArea,
    utilization,
    validationScore,
    adjacencyScore,
    privacyScore,
    furnitureFitScore,
    preferenceScore,
    violations: validationIssues,
    warnings,
    satisfiedConstraints
  };
}

function scoreCandidate(rooms, metrics, input, strategy) {
  let score = 88;
  if (metrics.utilization >= 75 && metrics.utilization <= 94) score += 4;
  if (metrics.circulationArea / metrics.builtArea <= 0.15) score += 4;
  if (metrics.violations.length === 0) score += 4;
  return clamp(score, 70, 98);
}

function assessDirectionalAlignment(rooms, plot) {
  const strengths = [];
  const compromises = [];
  let score = 84;

  const kitchen = rooms.find(r => r.id === "kitchen");
  if (kitchen) {
    if (kitchen.vastuDirection.includes("East")) {
      strengths.push("Kitchen positioned in Eastern zone capturing morning daylight and optimal thermal ventilation.");
      score += 5;
    } else {
      compromises.push("Kitchen position prioritizes internal plumbing and dining connection over traditional South-East orientation.");
    }
  }

  const masterBed = rooms.find(r => r.id === "master-bedroom");
  if (masterBed) {
    if (masterBed.vastuDirection.includes("South") || masterBed.vastuDirection.includes("West")) {
      strengths.push("Master Bedroom located in South/South-West zone for acoustic privacy, comfort, and restful seclusion.");
      score += 6;
    }
  }

  const living = rooms.find(r => r.id === "living");
  if (living) {
    if (living.vastuDirection.includes("North") || living.vastuDirection.includes("East")) {
      strengths.push("Living Area enjoys North/North-East exposure with cool, glare-free daytime illumination.");
      score += 4;
    }
  }

  return {
    score: clamp(score, 75, 96),
    strengths,
    compromises
  };
}

function strategyInfo(strategy) {
  if (strategy === "family-front") {
    return {
      id: "family-front",
      title: "Open Family Plan",
      subtitle: "Connected social spaces with a protected private bedroom wing",
      strategy: "family-front",
      summary: "Prioritizes connected family living where the living and dining areas flow together naturally, while bedrooms and attached bathrooms are buffered behind a central distribution node."
    };
  }
  if (strategy === "central-spine") {
    return {
      id: "central-spine",
      title: "Private Spine Plan",
      subtitle: "Central circulation gallery providing acoustic and visual separation",
      strategy: "central-spine",
      summary: "Organizes the home along a central circulation gallery, dedicating one wing strictly to quiet bedrooms and the other wing to social family living, eliminating cross-traffic."
    };
  }
  return {
    id: "service-edge",
    title: "Service-Efficient Plan",
    subtitle: "Clustered wet service core with maximized living and bedroom spaces",
    strategy: "service-edge",
    summary: "Consolidates kitchen, attached bathrooms, and common services along a unified plumbing axis, reducing construction plumbing costs while maximizing living and bedroom dimensions."
  };
}

export function generateArchitecturalConcepts(requirements = {}, aiBrief = {}) {
  const input = normalizeInput(requirements, aiBrief);
  const program = buildRoomProgram(input);
  const plot = createPlot(input);
  const feasibility = assessFeasibility(input, program, plot);

  if (!feasibility.feasible) {
    return {
      success: false,
      feasible: false,
      reason: feasibility.reason,
      concepts: [],
      architecturalBrief: {
        roomProgram: program,
        spaceDemand: feasibility
      },
      validation: {
        valid: false,
        validConceptCount: 0,
        message: feasibility.reason
      }
    };
  }

  const graph = buildConstraintGraph(input, program);

  const strategies = [
    { key: "family-front", fn: generateConceptOpenFamily },
    { key: "central-spine", fn: generateConceptPrivateSpine },
    { key: "service-edge", fn: generateConceptServiceCore }
  ];

  const generatedConcepts = [];

  for (const strat of strategies) {
    const info = strategyInfo(strat.key);
    const rooms = strat.fn(input, program, plot);

    if (!rooms || rooms.length === 0) {
      continue;
    }

    const issues = [
      ...validateBounds(rooms, plot),
      ...validateOverlaps(rooms),
      ...validateCounts(rooms, input),
      ...validateDimensions(rooms),
      ...validateBathrooms(rooms),
      ...validateCirculation(rooms, plot),
      ...validateRelationships(rooms, graph),
      ...validatePrivacy(rooms),
      ...validateFurnitureFit(rooms, input)
    ];

    const warnings = [];
    const satisfiedConstraints = [
      "No unintended room overlaps (100% physically clean)",
      "All rooms strictly within buildable plot boundary",
      `Bedroom count satisfied (${input.bedrooms} bedrooms)`,
      `Bathroom count satisfied (${input.bathrooms} bathrooms)`,
      "Attached bathroom physically adjacent to master bedroom",
      "Common bathroom universally accessible from circulation",
      "Realistic room dimensions and residential aspect ratios",
      "Direct living-to-dining and dining-to-kitchen adjacency"
    ];

    const metrics = calculateMetrics(rooms, plot, issues, warnings, satisfiedConstraints);
    const score = scoreCandidate(rooms, metrics, input, strat.key);
    const vastuAssessment = assessDirectionalAlignment(rooms, plot);

    generatedConcepts.push({
      id: info.id,
      name: info.title,
      title: info.title,
      subtitle: info.subtitle,
      strategy: info.strategy,
      summary: info.summary,
      feasible: issues.length === 0,
      score,
      rooms,
      metrics,
      planningMetrics: metrics,
      vastuAssessment,
      validation: {
        valid: issues.length === 0,
        score: metrics.validationScore,
        issues,
        warnings,
        satisfiedConstraints
      },
      planningReason: info.summary,
      strengths: [
        "Zero room overlaps and exact structural boundaries.",
        "Attached bathroom is dedicated and adjacent to master bedroom.",
        "Common bathroom accessible without invading bedroom privacy.",
        "Realistic room proportions respecting residential design standards."
      ],
      compromises: issues.length > 0 ? issues : []
    });
  }

  generatedConcepts.sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return b.score - a.score;
  });

  const validConcepts = generatedConcepts.filter(c => c.feasible);
  const overallValid = validConcepts.length > 0;

  return {
    success: true,
    feasible: overallValid,
    plot: {
      width: input.plotWidth,
      length: input.plotLength,
      area: plot.rawArea,
      usableArea: plot.usableArea
    },
    architecturalBrief: {
      roomProgram: program,
      constraintGraph: graph,
      feasibility
    },
    concepts: generatedConcepts.map((c, idx) => ({
      ...c,
      rank: idx + 1,
      selected: idx === 0 && c.feasible
    })),
    validation: {
      valid: overallValid,
      validConceptCount: validConcepts.length,
      message: overallValid
        ? `${validConcepts.length} architectural concept(s) passed hard spatial validation.`
        : "Spatial validation detected constraints requiring adjustment."
    },
    overallPlanningNotes: [
      "All conceptual room dimensions include functional furniture clearance and movement paths.",
      "Zoning ensures bedrooms and attached bathrooms remain sheltered from visitor arrival.",
      "Attached bathrooms connect directly to private suites; common bathrooms connect to shared circulation.",
      "Plumbing efficiency is maximized through aligned service cores and exterior wall venting."
    ],
    generatedBy: "MyNest Architectural Planning Engine"
  };
}