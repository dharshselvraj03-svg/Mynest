/*
  MyNest Spatial Planning Engine  (Step 2)
  ----------------------------------------
  Turns the user's requirements and the AI planning brief into ONE
  planning model that the layout generator will use:

    - plot and buildable area
    - room program (every room with minimum / preferred sizes in feet)
    - relationships (adjacent, attached, separate) with a strength:
      "required" or "preferred"
    - zones
    - capacity and feasibility
    - a validator that checks a generated layout against the model

  This is a conceptual planning engine. It is NOT a construction drawing
  or a statutory approval system.
*/

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

export const ZONES = {
  PUBLIC: "public",
  SEMI_PRIVATE: "semi-private",
  PRIVATE: "private",
  SERVICE: "service",
  PRIVATE_SERVICE: "private-service",
};

export const ROOM_TYPES = {
  LIVING: "living",
  DINING: "dining",
  KITCHEN: "kitchen",
  MASTER_BEDROOM: "masterBedroom",
  BEDROOM: "bedroom",
  BATHROOM: "bathroom",
  STUDY: "study",
  STORAGE: "storage",
  UTILITY: "utility",
  POOJA: "pooja",
};

/*
  Conceptual room sizes in feet.
  min = smallest acceptable, pref = comfortable.
*/
const SIZE_TABLE = {
  living: { minWidth: 10, minDepth: 10, prefWidth: 13, prefDepth: 14, priority: "high" },
  dining: { minWidth: 7, minDepth: 7, prefWidth: 10, prefDepth: 10, priority: "medium" },
  kitchen: { minWidth: 7, minDepth: 8, prefWidth: 9, prefDepth: 10, priority: "high" },
  masterBedroom: { minWidth: 10, minDepth: 11, prefWidth: 12, prefDepth: 13, priority: "high" },
  bedroom: { minWidth: 8.5, minDepth: 10, prefWidth: 10, prefDepth: 11, priority: "high" },
  bathroom: { minWidth: 5, minDepth: 6, prefWidth: 5, prefDepth: 7, priority: "medium" },
  study: { minWidth: 6, minDepth: 7, prefWidth: 8, prefDepth: 9, priority: "medium" },
  storage: { minWidth: 4, minDepth: 5, prefWidth: 5, prefDepth: 6, priority: "low" },
  pooja: { minWidth: 4, minDepth: 4, prefWidth: 5, prefDepth: 5, priority: "low" },
  utility: { minWidth: 5, minDepth: 7, prefWidth: 6, prefDepth: 8, priority: "medium" },
};

/* Kept for older code: minimum / preferred AREA in sq.ft. */
export const DEFAULT_ROOM_SIZES = Object.fromEntries(
  Object.entries(SIZE_TABLE).map(([key, size]) => [
    key,
    {
      min: size.minWidth * size.minDepth,
      preferred: size.prefWidth * size.prefDepth,
      priority: size.priority,
    },
  ])
);

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function numberOrDefault(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function collectStrings(value, found = []) {
  if (value === null || value === undefined) {
    return found;
  }

  if (typeof value === "string") {
    found.push(value);

    return found;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, found));

    return found;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, found));
  }

  return found;
}

function allText(value) {
  return collectStrings(value).join(" ");
}

function containsAny(value, words) {
  const source = lower(allText(value));

  return words.some((word) => source.includes(lower(word)));
}

/* -------------------------------------------------------------------------- */
/* PLOT                                                                       */
/* -------------------------------------------------------------------------- */

export function getPlot(requirements = {}) {
  const width = Math.max(20, numberOrDefault(requirements?.plotWidth, 30));

  const length = Math.max(25, numberOrDefault(requirements?.plotLength, 40));

  /* Conceptual planning margin. This is NOT a legal setback. */
  const margin = width <= 25 || length <= 30 ? 1.5 : 2;

  const buildableWidth = round1(width - margin * 2);

  const buildableLength = round1(length - margin * 2);

  return {
    width,
    length,
    area: round1(width * length),
    margin,
    x: margin,
    y: margin,
    buildableWidth,
    buildableLength,
    buildableArea: round1(buildableWidth * buildableLength),
  };
}

/* -------------------------------------------------------------------------- */
/* COUNTS                                                                     */
/* -------------------------------------------------------------------------- */

export function getBedroomCount(requirements = {}) {
  const ai = requirements?.aiAnalysis;

  return clamp(
    Math.round(numberOrDefault(requirements?.bedrooms, ai?.household?.bedrooms || 2)),
    1,
    6
  );
}

export function getBathroomCount(requirements = {}) {
  const ai = requirements?.aiAnalysis;

  return clamp(
    Math.round(numberOrDefault(requirements?.bathrooms, ai?.household?.bathrooms || 2)),
    1,
    6
  );
}

function getFamilySize(requirements) {
  return Math.max(1, Math.round(numberOrDefault(requirements?.people, 4)));
}

/* -------------------------------------------------------------------------- */
/* AI / PREFERENCE ACCESS                                                     */
/* -------------------------------------------------------------------------- */

function getAI(requirements) {
  return requirements?.aiAnalysis || {};
}

function getPreferenceText(requirements) {
  return allText({
    preferences: requirements?.preferences,
    ai: requirements?.aiAnalysis,
    furniture: requirements?.furniture,
  });
}

function getAISpace(requirements, words) {
  const spaces = Array.isArray(getAI(requirements).requiredSpaces)
    ? getAI(requirements).requiredSpaces
    : [];

  return (
    spaces.find((space) =>
      containsAny(`${space?.name || ""} ${space?.type || ""}`, words)
    ) || null
  );
}

function wantsStudy(requirements) {
  return (
    containsAny(getPreferenceText(requirements), [
      "study",
      "home office",
      "work from home",
    ]) || Boolean(getAISpace(requirements, ["study", "office"]))
  );
}

function wantsStorage(requirements) {
  return (
    containsAny(getPreferenceText(requirements), [
      "store room",
      "storage",
      "pantry",
      "utility",
    ]) ||
    Boolean(getAISpace(requirements, ["store", "storage", "pantry", "utility"]))
  );
}

function wantsPooja(requirements) {
  return (
    containsAny(getPreferenceText(requirements), ["pooja", "prayer room"]) ||
    Boolean(getAISpace(requirements, ["pooja", "prayer"]))
  );
}

/* -------------------------------------------------------------------------- */
/* ROOM IDS AND NAME MATCHING                                                 */
/* -------------------------------------------------------------------------- */

function listRoomIds(requirements) {
  const bedrooms = getBedroomCount(requirements);

  const bathrooms = getBathroomCount(requirements);

  const ids = ["living", "dining", "kitchen", "master-bedroom"];

  for (let index = 2; index <= bedrooms; index += 1) {
    ids.push(`bedroom-${index}`);
  }

  if (bathrooms >= 2) {
    ids.push("master-bathroom");
  }

  const commonCount = bathrooms >= 2 ? bathrooms - 1 : 1;

  for (let index = 1; index <= commonCount; index += 1) {
    ids.push(`common-bathroom-${index}`);
  }

  if (wantsStudy(requirements)) ids.push("study");
  if (wantsStorage(requirements)) ids.push("storage");
  if (wantsPooja(requirements)) ids.push("pooja");

  return ids;
}

/*
  Converts a name used by the user or the AI ("Master Bedroom", "store",
  "Bedroom 3") into a room id from the program. Returns null if no room
  matches, and "entrance" for the main entry.
*/
function matchRoomId(name, ids) {
  const text = lower(name).trim();

  if (!text) {
    return null;
  }

  if (ids.includes(text)) {
    return text;
  }

  if (/\b(entrance|entry|main door|gate)\b/.test(text)) {
    return "entrance";
  }

  const numbered = text.match(/bed\s*room\s*(\d)/);

  if (numbered) {
    const id = numbered[1] === "1" ? "master-bedroom" : `bedroom-${numbered[1]}`;

    return ids.includes(id) ? id : null;
  }

  if (text.includes("master") && /(bath|toilet|attached)/.test(text)) {
    return ids.includes("master-bathroom") ? "master-bathroom" : null;
  }

  if (text.includes("master")) {
    return "master-bedroom";
  }

  if (/attached/.test(text) && /bath/.test(text)) {
    return ids.includes("master-bathroom") ? "master-bathroom" : null;
  }

  if (/(bath|toilet|washroom)/.test(text)) {
    return ids.includes("common-bathroom-1") ? "common-bathroom-1" : null;
  }

  if (/(living|hall|drawing)/.test(text)) return "living";
  if (text.includes("dining")) return "dining";
  if (text.includes("kitchen")) return "kitchen";

  if (/(store|storage|pantry|utility)/.test(text)) {
    return ids.includes("storage") ? "storage" : null;
  }

  if (/(pooja|puja|prayer)/.test(text)) {
    return ids.includes("pooja") ? "pooja" : null;
  }

  if (/(study|office)/.test(text)) {
    return ids.includes("study") ? "study" : null;
  }

  if (text.includes("bed")) {
    return ids.includes("bedroom-2") ? "bedroom-2" : "master-bedroom";
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* USER SIZE PRIORITIES                                                       */
/* -------------------------------------------------------------------------- */

const SIZE_WORDS =
  /(spacious|larger|bigger|large|big|generous|wider|priority|more space)/;

const ROOM_KEYWORDS = [
  ["master-bedroom", ["master"]],
  ["living", ["living"]],
  ["kitchen", ["kitchen"]],
  ["dining", ["dining"]],
  ["study", ["study", "office"]],
];

/*
  Finds rooms the user wants larger, for example
  "I need the master bedroom to be spacious". Each text field is checked on
  its own so unrelated fields are never mixed together.
*/
function detectSizeBoosts(requirements, ids) {
  const boosts = {};

  const strings = [
    ...collectStrings(requirements?.preferences),
    ...collectStrings(requirements?.aiAnalysis),
  ];

  strings.forEach((value) => {
    String(value)
      .split(/[.;\n\r]+/)
      .forEach((line) => {
        const text = lower(line);

        if (!SIZE_WORDS.test(text)) {
          return;
        }

        ROOM_KEYWORDS.forEach(([id, words]) => {
          if (words.some((word) => text.includes(word))) {
            boosts[id] = true;
          }
        });

        if (text.includes("bedroom") && !text.includes("master")) {
          boosts.bedrooms = true;
        }
      });
  });

  /* A field such as "highestPriority: Master Bedroom". */
  const preferences = requirements?.preferences;

  if (preferences && typeof preferences === "object") {
    Object.entries(preferences).forEach(([key, value]) => {
      if (!/priorit/i.test(key)) {
        return;
      }

      collectStrings(value).forEach((text) => {
        const id = matchRoomId(text, ids);

        if (id && id !== "entrance") {
          boosts[id] = true;
        }
      });
    });
  }

  return boosts;
}

/* -------------------------------------------------------------------------- */
/* ROOM PROGRAM                                                               */
/* -------------------------------------------------------------------------- */

function buildRoom(requirements, boosts, spec) {
  const size = SIZE_TABLE[spec.sizeKey];

  const aiSpace = spec.aiWords ? getAISpace(requirements, spec.aiWords) : null;

  const boosted = Boolean(
    boosts[spec.id] || (spec.id.startsWith("bedroom-") && boosts.bedrooms)
  );

  const factor = boosted ? 1.15 : 1;

  const preferredWidth = round1(
    Math.max(
      size.minWidth,
      numberOrDefault(aiSpace?.preferredWidth, size.prefWidth)
    ) * factor
  );

  const preferredDepth = round1(
    Math.max(
      size.minDepth,
      numberOrDefault(aiSpace?.preferredLength, size.prefDepth)
    ) * factor
  );

  return {
    id: spec.id,
    name: spec.name,
    type: spec.type,
    sizeKey: spec.sizeKey,
    zone: spec.zone,
    priority: boosted ? "highest" : size.priority,
    userPriority: boosted,

    minWidth: size.minWidth,
    minDepth: size.minDepth,
    preferredWidth,
    preferredDepth,

    minArea: round1(size.minWidth * size.minDepth),
    preferredArea: round1(preferredWidth * preferredDepth),

    attachedTo: spec.attachedTo || null,
    accessFrom: spec.accessFrom || [],
    needsExternalWall: spec.needsExternalWall !== false,
  };
}

export function createRoomProgram(requirements = {}) {
  const ids = listRoomIds(requirements);

  const boosts = detectSizeBoosts(requirements, ids);

  const bedroomCount = getBedroomCount(requirements);

  const bathroomCount = getBathroomCount(requirements);

  const specs = [
    {
      id: "living",
      name: "Living Room",
      type: "living",
      sizeKey: "living",
      zone: ZONES.PUBLIC,
      accessFrom: ["entrance"],
      aiWords: ["living"],
    },
    {
      id: "dining",
      name: "Dining",
      type: "dining",
      sizeKey: "dining",
      zone: ZONES.PUBLIC,
      accessFrom: ["living"],
      aiWords: ["dining"],
    },
    {
      id: "kitchen",
      name: "Kitchen",
      type: "kitchen",
      sizeKey: "kitchen",
      zone: ZONES.SERVICE,
      accessFrom: ["dining"],
      aiWords: ["kitchen"],
    },
    {
      id: "master-bedroom",
      name: "Master Bedroom",
      type: "bedroom",
      sizeKey: "masterBedroom",
      zone: ZONES.PRIVATE,
      accessFrom: ["circulation"],
      aiWords: ["master"],
    },
  ];

  for (let index = 2; index <= bedroomCount; index += 1) {
    specs.push({
      id: `bedroom-${index}`,
      name: `Bedroom ${index}`,
      type: "bedroom",
      sizeKey: "bedroom",
      zone: ZONES.PRIVATE,
      accessFrom: ["circulation"],
    });
  }

  if (bathroomCount >= 2) {
    specs.push({
      id: "master-bathroom",
      name: "Master Attached Bath",
      type: "bathroom",
      sizeKey: "bathroom",
      zone: ZONES.PRIVATE_SERVICE,
      attachedTo: "master-bedroom",
      accessFrom: ["master-bedroom"],
      needsExternalWall: false,
    });
  }

  const commonCount = bathroomCount >= 2 ? bathroomCount - 1 : 1;

  for (let index = 1; index <= commonCount; index += 1) {
    specs.push({
      id: `common-bathroom-${index}`,
      name: commonCount === 1 ? "Common Bathroom" : `Common Bathroom ${index}`,
      type: "bathroom",
      sizeKey: "bathroom",
      zone: ZONES.SERVICE,
      accessFrom: ["circulation"],
      needsExternalWall: false,
    });
  }

  if (ids.includes("study")) {
    specs.push({
      id: "study",
      name: "Study",
      type: "study",
      sizeKey: "study",
      zone: ZONES.SEMI_PRIVATE,
      accessFrom: ["circulation"],
      aiWords: ["study", "office"],
    });
  }

  if (ids.includes("storage")) {
    specs.push({
      id: "storage",
      name: "Store / Pantry",
      type: "storage",
      sizeKey: "storage",
      zone: ZONES.SERVICE,
      accessFrom: ["kitchen"],
      aiWords: ["store", "storage", "pantry"],
      needsExternalWall: false,
    });
  }

  if (ids.includes("pooja")) {
    specs.push({
      id: "pooja",
      name: "Pooja Room",
      type: "pooja",
      sizeKey: "pooja",
      zone: ZONES.SEMI_PRIVATE,
      accessFrom: ["circulation"],
      aiWords: ["pooja", "prayer"],
      needsExternalWall: false,
    });
  }

  return specs.map((spec) => buildRoom(requirements, boosts, spec));
}

/* -------------------------------------------------------------------------- */
/* RELATIONSHIPS                                                              */
/* -------------------------------------------------------------------------- */

function normalizeStrength(value, fallback) {
  const text = lower(value);

  if (["required", "must", "high", "mandatory", "essential"].includes(text)) {
    return "required";
  }

  if (["preferred", "low", "medium", "optional", "nice"].includes(text)) {
    return "preferred";
  }

  return fallback;
}

function createRelationship(from, to, type, strength, source) {
  return {
    from,
    to,
    type,
    strength,
    priority: strength === "required" ? "high" : "medium",
    source,
  };
}

function relationshipKey(relationship) {
  const pair = [relationship.from, relationship.to].sort().join("|");

  return `${relationship.type}:${pair}`;
}

/*
  Builds the full relationship list and also reports user/AI relationships
  that could not be matched to a room, so nothing is silently ignored.
*/
function resolveRelationships(requirements, ids) {
  const found = new Map();

  const unresolved = [];

  const add = (relationship) => {
    if (!relationship.from || !relationship.to || relationship.from === relationship.to) {
      return;
    }

    const key = relationshipKey(relationship);

    const existing = found.get(key);

    if (!existing) {
      found.set(key, relationship);

      return;
    }

    if (relationship.strength === "required") {
      existing.strength = "required";
      existing.priority = "high";
    }
  };

  /* Defaults: basic residential logic. */
  add(createRelationship("living", "dining", "adjacent", "required", "default"));
  add(createRelationship("dining", "kitchen", "adjacent", "required", "default"));
  add(createRelationship("entrance", "living", "accessible", "required", "default"));

  if (ids.includes("master-bathroom")) {
    add(createRelationship("master-bedroom", "master-bathroom", "attached", "required", "default"));
  }

  ids
    .filter((id) => id.startsWith("bedroom-") || id === "master-bedroom")
    .forEach((id) => {
      add(createRelationship(id, "living", "separate", "preferred", "default"));
    });

  ids
    .filter((id) => id.startsWith("common-bathroom-"))
    .forEach((id) => {
      add(createRelationship(id, "kitchen", "separate", "preferred", "default"));
    });

  if (ids.includes("study")) {
    add(createRelationship("study", "kitchen", "separate", "preferred", "default"));
  }

  if (ids.includes("storage")) {
    const nearKitchen = collectStrings(getPreferenceText(requirements)).some((line) => {
      const text = lower(line);

      return /(store|storage|pantry)/.test(text) && text.includes("kitchen");
    });

    add(
      createRelationship(
        "storage",
        "kitchen",
        "adjacent",
        nearKitchen ? "required" : "preferred",
        nearKitchen ? "user" : "default"
      )
    );
  }

  /* User and AI relationships. */
  const addRequested = (first, second, type, strength, source) => {
    const from = matchRoomId(first, ids);

    const to = matchRoomId(second, ids);

    if (!from || !to) {
      unresolved.push({
        first,
        second,
        type,
        source,
        reason: "One of the spaces is not part of the generated room program.",
      });

      return;
    }

    add(createRelationship(from, to, type, strength, source));
  };

  const ai = getAI(requirements);

  const aiAdjacency = Array.isArray(ai.adjacencyRequirements) ? ai.adjacencyRequirements : [];

  const aiSeparation = Array.isArray(ai.separationRequirements) ? ai.separationRequirements : [];

  aiAdjacency.forEach((item) => {
    addRequested(
      item?.firstSpace,
      item?.secondSpace,
      "adjacent",
      normalizeStrength(item?.strength, "preferred"),
      "ai"
    );
  });

  aiSeparation.forEach((item) => {
    addRequested(
      item?.firstSpace,
      item?.secondSpace,
      "separate",
      normalizeStrength(item?.strength, "preferred"),
      "ai"
    );
  });

  const preferences = requirements?.preferences || {};

  const requestedRelationships = Array.isArray(preferences.relationships)
    ? preferences.relationships
    : [];

  const requestedSeparations = Array.isArray(preferences.separations)
    ? preferences.separations
    : [];

  requestedRelationships.forEach((item) => {
    addRequested(
      item?.from ?? item?.firstSpace ?? item?.first,
      item?.to ?? item?.secondSpace ?? item?.second,
      "adjacent",
      normalizeStrength(item?.strength ?? item?.priority, "required"),
      "user"
    );
  });

  requestedSeparations.forEach((item) => {
    addRequested(
      item?.from ?? item?.firstSpace ?? item?.first,
      item?.to ?? item?.secondSpace ?? item?.second,
      "separate",
      normalizeStrength(item?.strength ?? item?.priority, "required"),
      "user"
    );
  });

  return {
    relationships: Array.from(found.values()),
    unresolved,
  };
}

export function createPlanningRelationships(requirements = {}) {
  return resolveRelationships(requirements, listRoomIds(requirements)).relationships;
}

/* -------------------------------------------------------------------------- */
/* ZONES AND DEMAND                                                           */
/* -------------------------------------------------------------------------- */

export function createZones(roomProgram = []) {
  const zones = {
    [ZONES.PUBLIC]: [],
    [ZONES.SEMI_PRIVATE]: [],
    [ZONES.PRIVATE]: [],
    [ZONES.SERVICE]: [],
    [ZONES.PRIVATE_SERVICE]: [],
  };

  roomProgram.forEach((room) => {
    if (!zones[room.zone]) {
      zones[room.zone] = [];
    }

    zones[room.zone].push(room.id);
  });

  return zones;
}

export function calculateSpaceDemand(roomProgram = []) {
  return round1(roomProgram.reduce((total, room) => total + room.minArea, 0));
}

export function calculatePreferredSpace(roomProgram = []) {
  return round1(roomProgram.reduce((total, room) => total + room.preferredArea, 0));
}

/* -------------------------------------------------------------------------- */
/* CAPACITY                                                                   */
/* -------------------------------------------------------------------------- */

/*
  About 15% of the buildable area is kept for walls and circulation.
  This is a conceptual allowance, NOT a building-code calculation.
*/
const CIRCULATION_ALLOWANCE = 0.85;

export function evaluatePlotCapacity(requirements = {}, roomProgram = []) {
  const plot = getPlot(requirements);

  const minimumDemand = calculateSpaceDemand(roomProgram);

  const preferredDemand = calculatePreferredSpace(roomProgram);

  const usableArea = round1(plot.buildableArea * CIRCULATION_ALLOWANCE);

  let status = "comfortable";

  if (minimumDemand > plot.buildableArea) {
    status = "infeasible";
  } else if (minimumDemand > usableArea) {
    status = "high-pressure";
  } else if (preferredDemand > usableArea) {
    status = "compact";
  }

  return {
    plotArea: plot.area,
    buildableArea: plot.buildableArea,
    conceptualBuildableArea: usableArea,
    minimumDemand,
    preferredDemand,
    status,
    minimumAreaGap: round1(usableArea - minimumDemand),
    preferredAreaGap: round1(usableArea - preferredDemand),
  };
}

/* -------------------------------------------------------------------------- */
/* FEASIBILITY                                                                */
/* -------------------------------------------------------------------------- */

const UNSUPPORTED_SPACES = [
  { label: "Parking", words: ["parking", "garage", "car porch"] },
  { label: "Balcony", words: ["balcony", "terrace", "sit-out"] },
  { label: "Guest room", words: ["guest room", "guest bedroom"] },
];

function evaluateFeasibility(requirements, plot, roomProgram, capacity) {
  const warnings = [];

  if (capacity.status === "infeasible") {
    warnings.push(
      "The requested rooms need more area than this plot can hold, even at minimum sizes."
    );
  } else if (capacity.status === "high-pressure") {
    warnings.push(
      "The requested rooms fit only at minimum sizes. Expect tight rooms and little circulation."
    );
  } else if (capacity.status === "compact") {
    warnings.push(
      "The plot cannot give every room its comfortable size. Some rooms will be smaller than ideal."
    );
  }

  if (getBedroomCount(requirements) >= 4 && plot.buildableLength < 30) {
    warnings.push(
      "This many bedrooms on a plot this short may be better planned across more than one floor."
    );
  }

  if (plot.buildableWidth < SIZE_TABLE.bedroom.minWidth * 2) {
    warnings.push("The plot is too narrow to place two bedrooms side by side.");
  }

  const text = getPreferenceText(requirements);

  const unsupportedRequests = UNSUPPORTED_SPACES.filter((space) =>
    containsAny(text, space.words)
  ).map((space) => space.label);

  unsupportedRequests.forEach((label) => {
    warnings.push(`${label} was requested but is not planned by this version yet.`);
  });

  const status =
    capacity.status === "infeasible"
      ? "infeasible"
      : warnings.length > 0
        ? "needs-attention"
        : "feasible";

  return { status, warnings, unsupportedRequests };
}

/* -------------------------------------------------------------------------- */
/* PLANNING MODEL                                                             */
/* -------------------------------------------------------------------------- */

export function buildPlanningModel(requirements = {}) {
  const plot = getPlot(requirements);

  const roomProgram = createRoomProgram(requirements);

  const ids = roomProgram.map((room) => room.id);

  const { relationships, unresolved } = resolveRelationships(requirements, ids);

  const zones = createZones(roomProgram);

  const capacity = evaluatePlotCapacity(requirements, roomProgram);

  const feasibility = evaluateFeasibility(requirements, plot, roomProgram, capacity);

  const sizeBoosts = roomProgram.filter((room) => room.userPriority).map((room) => room.id);

  return {
    plot,
    familySize: getFamilySize(requirements),
    bedroomCount: getBedroomCount(requirements),
    bathroomCount: getBathroomCount(requirements),

    roomProgram,
    relationships,
    unresolvedRelationships: unresolved,
    zones,
    sizeBoosts,

    capacity,
    feasibility,

    planningPrinciples: [
      "Protect private spaces from unnecessary public circulation.",
      "Keep required adjacent rooms directly connected.",
      "Keep common bathrooms reachable from circulation, not through a bedroom.",
      "Attach a bathroom to a bedroom only when it is intended for that bedroom.",
      "Give rooms usable proportions, not just enough area.",
      "Prefer purposeful circulation over leftover space.",
      "Respect the plot boundary.",
      "Reject layouts with severe conflicts before showing them.",
    ],
  };
}

export function getProgramRoom(planningModel, id) {
  return planningModel?.roomProgram?.find((room) => room.id === id) || null;
}

/* -------------------------------------------------------------------------- */
/* GEOMETRY HELPERS (shared with the generator)                               */
/* -------------------------------------------------------------------------- */

const TOLERANCE = 0.15;

function getGeometry(room) {
  return {
    x: Number(room?.x) || 0,
    y: Number(room?.y) || 0,
    w: Number(room?.width ?? room?.w) || 0,
    h: Number(room?.length ?? room?.h ?? room?.height) || 0,
  };
}

export function roomsOverlap(first, second) {
  const a = getGeometry(first);

  const b = getGeometry(second);

  return !(
    a.x + a.w <= b.x + TOLERANCE ||
    b.x + b.w <= a.x + TOLERANCE ||
    a.y + a.h <= b.y + TOLERANCE ||
    b.y + b.h <= a.y + TOLERANCE
  );
}

export function roomsTouch(first, second) {
  const a = getGeometry(first);

  const b = getGeometry(second);

  const sideBySide =
    (Math.abs(a.x + a.w - b.x) < TOLERANCE || Math.abs(b.x + b.w - a.x) < TOLERANCE) &&
    a.y < b.y + b.h - TOLERANCE &&
    a.y + a.h > b.y + TOLERANCE;

  const stacked =
    (Math.abs(a.y + a.h - b.y) < TOLERANCE || Math.abs(b.y + b.h - a.y) < TOLERANCE) &&
    a.x < b.x + b.w - TOLERANCE &&
    a.x + a.w > b.x + TOLERANCE;

  return sideBySide || stacked;
}

/* -------------------------------------------------------------------------- */
/* LAYOUT VALIDATION                                                          */
/* -------------------------------------------------------------------------- */

/*
  Checks a generated layout against the planning model.

  layout = { rooms: [ { id, name, x, y, width, length } ] }
  (w / h / height are also accepted.)
*/
export function validateSpatialLayout(layout, planningModel) {
  const errors = [];
  const warnings = [];

  if (!layout || !Array.isArray(layout.rooms) || !planningModel) {
    return {
      valid: false,
      errors: ["No valid room layout was generated."],
      warnings: [],
      score: 0,
    };
  }

  const rooms = layout.rooms;

  const plot = planningModel.plot;

  /* Boundary */
  rooms.forEach((room) => {
    const g = getGeometry(room);

    const outside =
      g.x < plot.x - 0.01 ||
      g.y < plot.y - 0.01 ||
      g.x + g.w > plot.x + plot.buildableWidth + 0.05 ||
      g.y + g.h > plot.y + plot.buildableLength + 0.05;

    if (outside) {
      errors.push(`${room.name || room.id} extends outside the buildable area.`);
    }

    if (g.w <= 0 || g.h <= 0) {
      errors.push(`${room.name || room.id} has invalid dimensions.`);
    }
  });

  /* Overlaps */
  for (let i = 0; i < rooms.length; i += 1) {
    for (let j = i + 1; j < rooms.length; j += 1) {
      if (roomsOverlap(rooms[i], rooms[j])) {
        errors.push(`${rooms[i].name || rooms[i].id} overlaps ${rooms[j].name || rooms[j].id}.`);
      }
    }
  }

  const roomMap = Object.fromEntries(rooms.map((room) => [room.id, room]));

  /* Required rooms and minimum sizes */
  planningModel.roomProgram.forEach((programRoom) => {
    const generated = roomMap[programRoom.id];

    if (!generated) {
      errors.push(`Required room ${programRoom.name} is missing.`);

      return;
    }

    const g = getGeometry(generated);

    const short = Math.min(g.w, g.h);

    const long = Math.max(g.w, g.h);

    const minShort = Math.min(programRoom.minWidth, programRoom.minDepth);

    const minLong = Math.max(programRoom.minWidth, programRoom.minDepth);

    if (short < minShort - TOLERANCE || long < minLong - TOLERANCE) {
      warnings.push(`${programRoom.name} is below its minimum conceptual size.`);
    }
  });

  /* Relationships */
  planningModel.relationships.forEach((relationship) => {
    const first = roomMap[relationship.from];

    const second = roomMap[relationship.to];

    if (!first || !second) {
      return;
    }

    const touching = roomsTouch(first, second);

    const label = `${first.name || first.id} and ${second.name || second.id}`;

    const required = relationship.strength === "required";

    if (relationship.type === "adjacent" || relationship.type === "attached") {
      if (!touching) {
        (required ? errors : warnings).push(`${label} should be directly adjacent.`);
      }
    }

    if (relationship.type === "separate" && touching) {
      (required ? errors : warnings).push(`${label} should not be directly connected.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score: errors.length === 0 ? Math.max(0, 100 - warnings.length * 5) : 0,
  };
}