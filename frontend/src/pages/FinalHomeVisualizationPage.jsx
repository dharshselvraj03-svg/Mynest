import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateUpperFloorConcept } from "../utils/upperFloorPlanner";

const FLOOR_HEIGHT = 10;
const WALL_HEIGHT = 8;
const WALL_THICKNESS = 0.35;

const FURNITURE_DEFAULTS = {
  Sofa: { width: 7.5, depth: 3.0, type: "sofa" },
  "TV / TV Unit": { width: 5.5, depth: 1.4, type: "tv" },
  "Coffee Table": { width: 3.5, depth: 2.0, type: "coffee" },
  "Dining Table": { width: 6.0, depth: 3.0, type: "dining" },
  "Dining Chairs": { width: 1.8, depth: 1.8, type: "chair" },
  "Bed": { width: 6.5, depth: 6.5, type: "bed" },
  "Wardrobe": { width: 6.0, depth: 2.0, type: "wardrobe" },
  "Study Table": { width: 4.0, depth: 2.0, type: "desk" },
  "Bookshelf": { width: 3.0, depth: 1.2, type: "shelf" },
  "Dressing Table": { width: 4.0, depth: 1.8, type: "dresser" },
  "Shoe Rack": { width: 3.0, depth: 1.2, type: "shoe" },
  "Refrigerator": { width: 3.0, depth: 2.5, type: "fridge" },
  "Washing Machine": { width: 2.2, depth: 2.2, type: "washer" },
  "Microwave": { width: 2.0, depth: 1.6, type: "appliance" },
  "Oven": { width: 2.4, depth: 2.0, type: "appliance" },
  "Dishwasher": { width: 2.0, depth: 2.0, type: "appliance" },
  "Air Conditioner": { width: 3.0, depth: 0.9, type: "ac" },
  "Cooler": { width: 2.0, depth: 1.6, type: "appliance" },
  "Water Purifier": { width: 1.4, depth: 1.0, type: "purifier" },
  "TV": { width: 4.5, depth: 1.0, type: "tv" },
};

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatNumber(value) {
  const number = safeNumber(value, NaN);
  if (!Number.isFinite(number)) return "—";
  return number % 1 === 0 ? String(number) : number.toFixed(1);
}

function getPlot(requirements = {}, concept = null) {
  const width = safeNumber(
    requirements?.plotWidth ?? concept?.plot?.width,
    30
  );
  const length = safeNumber(
    requirements?.plotLength ?? concept?.plot?.length,
    40
  );

  return {
    width: Math.max(10, width),
    length: Math.max(10, length),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function roomName(room) {
  return String(room?.name || room?.label || room?.type || "Room");
}

function roomType(room) {
  return String(room?.type || "").toLowerCase();
}

function isBedroom(room) {
  return roomType(room) === "bedroom" || roomName(room).toLowerCase().includes("bedroom");
}

function isLiving(room) {
  return roomType(room) === "living" || roomName(room).toLowerCase().includes("living");
}

function isDining(room) {
  return roomType(room) === "dining" || roomName(room).toLowerCase().includes("dining");
}

function isKitchen(room) {
  return roomType(room) === "kitchen" || roomName(room).toLowerCase().includes("kitchen");
}

function isBathroom(room) {
  return roomType(room) === "bathroom" || roomName(room).toLowerCase().includes("bath");
}

function isUtility(room) {
  const name = roomName(room).toLowerCase();
  return (
    roomType(room) === "utility" ||
    roomType(room) === "laundry" ||
    name.includes("utility") ||
    name.includes("laundry")
  );
}

function isStudy(room) {
  const name = roomName(room).toLowerCase();
  return roomType(room) === "study" || name.includes("study") || name.includes("office");
}

function isStorage(room) {
  const name = roomName(room).toLowerCase();
  return roomType(room) === "storage" || name.includes("storage");
}

function furnitureSource(requirements = {}) {
  const furniture = requirements?.furniture || {};
  const values = [
    ...(Array.isArray(furniture.ownedFurniture) ? furniture.ownedFurniture : []),
    ...(Array.isArray(furniture.plannedFurniture) ? furniture.plannedFurniture : []),
    ...(Array.isArray(furniture.ownedAppliances) ? furniture.ownedAppliances : []),
    ...(Array.isArray(furniture.plannedAppliances) ? furniture.plannedAppliances : []),
  ];

  return Array.from(new Set(values.filter(Boolean)));
}

function furnitureDetail(requirements, item) {
  return requirements?.furniture?.furnitureDetails?.[item] || {};
}

function furnitureSize(requirements, item) {
  const detail = furnitureDetail(requirements, item);
  const fallback = FURNITURE_DEFAULTS[item] || {
    width: 3,
    depth: 2,
    type: "appliance",
  };

  const width = safeNumber(detail.width, fallback.width);
  const depth = safeNumber(detail.depth, fallback.depth);

  return {
    width: Math.max(0.5, width),
    depth: Math.max(0.5, depth),
    type: fallback.type,
  };
}

function itemMatches(item, names) {
  const value = item.toLowerCase();
  return names.some((name) => value.includes(name));
}

function itemsForRoom(room, items) {
  const result = [];

  for (const item of items) {
    if (isLiving(room)) {
      if (
        itemMatches(item, ["sofa", "tv", "coffee table", "air conditioner", "cooler"])
      ) {
        result.push(item);
      }
      continue;
    }

    if (isDining(room)) {
      if (itemMatches(item, ["dining", "air conditioner", "cooler"])) {
        result.push(item);
      }
      continue;
    }

    if (isKitchen(room)) {
      if (
        itemMatches(item, [
          "refrigerator",
          "microwave",
          "oven",
          "dishwasher",
          "water purifier",
          "air conditioner",
          "cooler",
        ])
      ) {
        result.push(item);
      }
      continue;
    }

    if (isUtility(room)) {
      if (itemMatches(item, ["washing machine", "water purifier", "air conditioner"])) {
        result.push(item);
      }
      continue;
    }

    if (isStudy(room)) {
      if (itemMatches(item, ["study table", "bookshelf", "chair", "air conditioner", "cooler"])) {
        result.push(item);
      }
      continue;
    }

    if (isStorage(room)) {
      if (itemMatches(item, ["wardrobe", "shoe rack", "bookshelf"])) {
        result.push(item);
      }
      continue;
    }

    if (isBedroom(room)) {
      if (
        itemMatches(item, [
          "bed",
          "wardrobe",
          "dressing table",
          "study table",
          "bookshelf",
          "air conditioner",
          "cooler",
          "tv",
        ])
      ) {
        result.push(item);
      }
      continue;
    }
  }

  return result;
}

function furnitureForFloor(concept, requirements) {
  const items = furnitureSource(requirements);
  const rooms = Array.isArray(concept?.rooms) ? concept.rooms : [];

  return rooms.map((room, roomIndex) => {
    const roomItems = itemsForRoom(room, items);
    const placements = [];
    const roomWidth = safeNumber(room.width, 0);
    const roomLength = safeNumber(room.length, 0);

    roomItems.forEach((item, itemIndex) => {
      const size = furnitureSize(requirements, item);
      const safeWidth = Math.min(size.width, Math.max(0.6, roomWidth - 0.5));
      const safeDepth = Math.min(size.depth, Math.max(0.6, roomLength - 0.5));
      const type = size.type;

      let x = room.x + 0.35;
      let y = room.y + 0.35;

      if (isBedroom(room)) {
        if (type === "bed") {
          x = room.x + Math.max(0.2, (roomWidth - safeWidth) / 2);
          y = room.y + 0.65;
        } else if (type === "wardrobe") {
          x = room.x + Math.max(0.2, roomWidth - safeWidth - 0.35);
          y = room.y + 0.35;
        } else if (type === "dresser") {
          x = room.x + 0.35;
          y = room.y + Math.max(0.3, roomLength - safeDepth - 0.35);
        } else {
          x = room.x + 0.35 + (itemIndex % 2) * Math.max(0.8, roomWidth / 3);
          y = room.y + Math.max(0.35, roomLength - safeDepth - 0.35);
        }
      } else if (isLiving(room)) {
        if (type === "sofa") {
          x = room.x + 0.45;
          y = room.y + 0.45;
        } else if (type === "tv") {
          x = room.x + Math.max(0.2, roomWidth - safeWidth - 0.35);
          y = room.y + 0.4;
        } else {
          x = room.x + Math.max(0.35, (roomWidth - safeWidth) / 2);
          y = room.y + Math.max(0.5, (roomLength - safeDepth) / 2);
        }
      } else if (isDining(room)) {
        x = room.x + Math.max(0.35, (roomWidth - safeWidth) / 2);
        y = room.y + Math.max(0.4, (roomLength - safeDepth) / 2);
      } else if (isKitchen(room)) {
        x = room.x + 0.35 + (itemIndex % 3) * Math.max(0.7, roomWidth / 3.5);
        y = room.y + 0.4;
      } else if (isStudy(room)) {
        x = room.x + 0.35;
        y = room.y + Math.max(0.35, roomLength - safeDepth - 0.35);
      } else if (isUtility(room)) {
        x = room.x + 0.35 + (itemIndex % 2) * Math.max(0.8, roomWidth / 2.5);
        y = room.y + 0.35;
      } else {
        x = room.x + 0.35;
        y = room.y + 0.35 + (itemIndex % 2) * Math.max(0.8, roomLength / 3);
      }

      x = Math.max(room.x + 0.15, Math.min(x, room.x + roomWidth - safeWidth - 0.15));
      y = Math.max(room.y + 0.15, Math.min(y, room.y + roomLength - safeDepth - 0.15));

      placements.push({
        id: `${room.id}-${item}-${itemIndex}`,
        item,
        type,
        x,
        y,
        width: safeWidth,
        depth: safeDepth,
      });
    });

    return {
      roomId: room.id || `room-${roomIndex}`,
      items: placements,
    };
  });
}

function deriveUpperFloor(requirements, groundConcept, aiAnalysis) {
  const explicit =
    requirements?.upperFloorConcept ||
    requirements?.secondFloorConcept ||
    null;

  if (explicit?.rooms?.length) {
    return explicit;
  }

  if (groundConcept?.floors?.[1]?.rooms?.length) {
    return groundConcept.floors[1];
  }

  try {
    const groundBedrooms = (groundConcept?.rooms || []).filter(isBedroom).length;
    const requestedBedrooms = Math.max(1, safeNumber(requirements?.bedrooms, 2));
    const upperBedrooms = Math.max(1, Math.min(3, requestedBedrooms - Math.max(0, groundBedrooms - 1)));

    return generateUpperFloorConcept(
      requirements,
      aiAnalysis,
      groundConcept,
      {
        bedrooms: upperBedrooms,
        bathrooms: Math.max(1, Math.min(2, safeNumber(requirements?.bathrooms, 1))),
        strategy: groundConcept?.strategy || "family",
        extraSpaces: ["study"],
        balcony: true,
      }
    );
  } catch (error) {
    console.error("MyNest final upper-floor generation failed:", error);
    return null;
  }
}

function isoPoint(x, y, z, scale, origin) {
  return {
    x: origin.x + (x - y) * scale,
    y: origin.y + (x + y) * scale * 0.5 - z * scale * 0.95,
  };
}

function polygon(points) {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}

function roomIsoPolygon(room, z, scale, origin) {
  const x = safeNumber(room.x);
  const y = safeNumber(room.y);
  const w = safeNumber(room.width);
  const l = safeNumber(room.length);
  return [
    isoPoint(x, y, z, scale, origin),
    isoPoint(x + w, y, z, scale, origin),
    isoPoint(x + w, y + l, z, scale, origin),
    isoPoint(x, y + l, z, scale, origin),
  ];
}

function wallPolygons(room, z, scale, origin) {
  const x = safeNumber(room.x);
  const y = safeNumber(room.y);
  const w = safeNumber(room.width);
  const l = safeNumber(room.length);
  const top = z + WALL_HEIGHT;
  const a = isoPoint(x, y, z, scale, origin);
  const b = isoPoint(x + w, y, z, scale, origin);
  const c = isoPoint(x + w, y + l, z, scale, origin);
  const d = isoPoint(x, y + l, z, scale, origin);
  const at = isoPoint(x, y, top, scale, origin);
  const bt = isoPoint(x + w, y, top, scale, origin);
  const ct = isoPoint(x + w, y + l, top, scale, origin);
  const dt = isoPoint(x, y + l, top, scale, origin);

  return {
    front: [a, b, bt, at],
    side: [b, c, ct, bt],
    back: [c, d, dt, ct],
    left: [d, a, at, dt],
  };
}

function roomSurface(room, z, scale, origin, selected) {
  const points = roomIsoPolygon(room, z, scale, origin);
  const type = roomType(room);
  const fills = {
    bedroom: "#E8DFD2",
    living: "#DDD8CD",
    dining: "#E6E0D4",
    kitchen: "#D8D0C2",
    bathroom: "#D6E1DF",
    study: "#E0DED3",
    utility: "#D9D8D1",
    storage: "#E2DDD3",
    stair: "#C9C4B9",
  };

  return {
    points,
    fill: fills[type] || "#E0DDD4",
    stroke: selected ? "#53604F" : "#555951",
  };
}

function FurnitureShape({ item, z, scale, origin }) {
  const base = isoPoint(item.x, item.y, z + 0.2, scale, origin);
  const w = item.width;
  const d = item.depth;
  const top = z + 1.2;
  const p1 = isoPoint(item.x, item.y, top, scale, origin);
  const p2 = isoPoint(item.x + w, item.y, top, scale, origin);
  const p3 = isoPoint(item.x + w, item.y + d, top, scale, origin);
  const p4 = isoPoint(item.x, item.y + d, top, scale, origin);

  const front1 = base;
  const front2 = isoPoint(item.x + w, item.y, z + 0.2, scale, origin);
  const side2 = isoPoint(item.x + w, item.y + d, z + 0.2, scale, origin);
  const side1 = isoPoint(item.x, item.y + d, z + 0.2, scale, origin);

  const palettes = {
    bed: ["#B7A18A", "#8F7A66", "#EDE7DC"],
    sofa: ["#9B9187", "#766D65", "#C6BBB0"],
    dining: ["#8D6849", "#6A4E39", "#B89A78"],
    chair: ["#A27E5E", "#76573F", "#C0A17E"],
    wardrobe: ["#8F765E", "#6B5745", "#B09A82"],
    tv: ["#4A4B47", "#30312E", "#666863"],
    coffee: ["#9A7656", "#6E523D", "#C3A889"],
    desk: ["#927353", "#654C39", "#B59A7C"],
    shelf: ["#8C7157", "#604B39", "#B49A7D"],
    dresser: ["#9A7B5D", "#6B5440", "#BDA184"],
    shoe: ["#92775B", "#604C3C", "#BBA188"],
    fridge: ["#AEB0AD", "#777975", "#D2D3D0"],
    washer: ["#B7B8B4", "#7E807B", "#D8D8D4"],
    appliance: ["#AAA9A4", "#74736F", "#D2D0CA"],
    ac: ["#E5E3DC", "#AAA9A3", "#F3F1EB"],
    purifier: ["#D7DDD8", "#7A8580", "#F0F2ED"],
  };

  const [topFill, frontFill, sideFill] = palettes[item.type] || palettes.appliance;

  return (
    <g pointerEvents="none">
      <polygon points={polygon([p4, p3, side2, side1])} fill={sideFill} stroke="#5B5D58" strokeWidth="0.45" />
      <polygon points={polygon([p2, p3, side2, front2])} fill={frontFill} stroke="#565852" strokeWidth="0.45" />
      <polygon points={polygon([p1, p2, p3, p4])} fill={topFill} stroke="#4F514C" strokeWidth="0.45" />

      {item.type === "bed" && (
        <polygon
          points={polygon([
            isoPoint(item.x + 0.3, item.y + 0.3, top + 0.05, scale, origin),
            isoPoint(item.x + w - 0.3, item.y + 0.3, top + 0.05, scale, origin),
            isoPoint(item.x + w - 0.3, item.y + Math.min(d * 0.32, 1.4), top + 0.05, scale, origin),
            isoPoint(item.x + 0.3, item.y + Math.min(d * 0.32, 1.4), top + 0.05, scale, origin),
          ])}
          fill="#F3EFE7"
          stroke="#C8BBAA"
          strokeWidth="0.3"
        />
      )}

      {item.type === "tv" && (
        <polygon
          points={polygon([
            isoPoint(item.x + 0.2, item.y + 0.1, top + 0.05, scale, origin),
            isoPoint(item.x + w - 0.2, item.y + 0.1, top + 0.05, scale, origin),
            isoPoint(item.x + w - 0.2, item.y + d - 0.1, top + 0.05, scale, origin),
            isoPoint(item.x + 0.2, item.y + d - 0.1, top + 0.05, scale, origin),
          ])}
          fill="#242522"
          stroke="#777973"
          strokeWidth="0.3"
        />
      )}
    </g>
  );
}

function FurnitureLayer({ concept, requirements, z, scale, origin }) {
  const layouts = furnitureForFloor(concept, requirements);
  const roomMap = new Map((concept?.rooms || []).map((room) => [room.id, room]));

  return (
    <g>
      {layouts.flatMap((layout) =>
        layout.items.map((item) => (
          <FurnitureShape
            key={item.id}
            item={item}
            z={z}
            scale={scale}
            origin={origin}
          />
        ))
      )}
    </g>
  );
}

function OrbitHouse3D({ ground, upper, requirements, activeFloor, setActiveFloor }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [yaw, setYaw] = useState(-42);
  const [pitch, setPitch] = useState(28);
  const [zoom, setZoom] = useState(1);

  const plot = getPlot(requirements, ground);

  const geometry = useMemo(() => {
    const floors = [];
    if (activeFloor !== "upper" && ground) floors.push({ concept: ground, z: 0, floor: 1 });
    if (activeFloor !== "ground" && upper) floors.push({ concept: upper, z: FLOOR_HEIGHT, floor: 2 });
    return floors;
  }, [activeFloor, ground, upper]);

  const resetView = () => {
    setYaw(-42);
    setPitch(28);
    setZoom(1);
  };

  const rotate = (amount) => setYaw((value) => value + amount);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(520, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#EEF1EC");
    bg.addColorStop(1, "#DDE2DC");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;
    const cosY = Math.cos(radYaw);
    const sinY = Math.sin(radYaw);
    const cosP = Math.cos(radPitch);
    const sinP = Math.sin(radPitch);

    const centerX = plot.width / 2;
    const centerY = plot.length / 2;
    const centerZ = activeFloor === "ground" ? 3 : 8;
    const baseScale = Math.min(
      width / Math.max(plot.width + 10, 32),
      height / Math.max(plot.length * 0.72 + 24, 34)
    );
    const scale = Math.max(7, Math.min(18, baseScale * zoom));

    function project(x, y, z) {
      const px = x - centerX;
      const py = y - centerY;
      const pz = z - centerZ;
      const rx = px * cosY - py * sinY;
      const ry = px * sinY + py * cosY;
      const rz = pz;
      const py2 = ry * cosP - rz * sinP;
      const depth = ry * sinP + rz * cosP;
      const perspective = 1 / Math.max(0.72, 1 + depth * 0.008);
      return {
        x: width / 2 + rx * scale * perspective,
        y: height / 2 - py2 * scale * perspective,
        depth,
      };
    }

    function polygon(points, fill, stroke = "#6B6C66", lineWidth = 0.8, alpha = 1) {
      if (!points.length) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.restore();
    }

    function cuboidFaces(x, y, w, d, z, h) {
      const v = [
        project(x, y, z),
        project(x + w, y, z),
        project(x + w, y + d, z),
        project(x, y + d, z),
        project(x, y, z + h),
        project(x + w, y, z + h),
        project(x + w, y + d, z + h),
        project(x, y + d, z + h),
      ];
      return [
        { points: [v[0], v[1], v[5], v[4]], depth: avgDepth([v[0], v[1], v[5], v[4]]), fill: "#C9C6BD" },
        { points: [v[1], v[2], v[6], v[5]], depth: avgDepth([v[1], v[2], v[6], v[5]]), fill: "#B7B5AE" },
        { points: [v[2], v[3], v[7], v[6]], depth: avgDepth([v[2], v[3], v[7], v[6]]), fill: "#C2BFB7" },
        { points: [v[3], v[0], v[4], v[7]], depth: avgDepth([v[3], v[0], v[4], v[7]]), fill: "#B1B0AA" },
        { points: [v[4], v[5], v[6], v[7]], depth: avgDepth([v[4], v[5], v[6], v[7]]), fill: "#E2DED4" },
      ];
    }

    function avgDepth(points) {
      return points.reduce((sum, point) => sum + point.depth, 0) / points.length;
    }

    const faces = [];

    // Plot slab.
    const plotFaces = cuboidFaces(-1, -1, plot.width + 2, plot.length + 2, -0.25, 0.25);
    plotFaces.forEach((face) => faces.push({ ...face, kind: "plot", alpha: 0.42 }));

    geometry.forEach(({ concept, z, floor }) => {
      (concept?.rooms || []).forEach((room) => {
        const x = safeNumber(room.x);
        const y = safeNumber(room.y);
        const w = safeNumber(room.width);
        const d = safeNumber(room.length);
        if (!(w > 0 && d > 0)) return;

        const roomFaces = cuboidFaces(x, y, w, d, z, WALL_HEIGHT);
        roomFaces.forEach((face, index) => {
          faces.push({
            ...face,
            kind: "room",
            floor,
            alpha: index === 4 ? 0.82 : 0.34,
            fill: roomSurface(room, z, 1, { x: 0, y: 0 }, false).fill,
          });
        });

        const layouts = furnitureForFloor(concept, requirements).find((item) => item.roomId === room.id);
        (layouts?.items || []).forEach((item) => {
          const fw = safeNumber(item.width, 1);
          const fd = safeNumber(item.depth, 1);
          const fh = item.type === "ac" ? 0.35 : item.type === "tv" ? 1.0 : 1.15;
          const furnitureFaces = cuboidFaces(item.x, item.y, fw, fd, z + 0.15, fh);
          furnitureFaces.forEach((face, index) => {
            faces.push({
              ...face,
              kind: "furniture",
              alpha: 1,
              fill: furnitureFill(item.type, index),
            });
          });
        });
      });
    });

    faces.sort((a, b) => b.depth - a.depth);
    faces.forEach((face) => polygon(face.points, face.fill, face.kind === "furniture" ? "#55564F" : "#70726B", face.kind === "furniture" ? 0.65 : 0.7, face.alpha));

    // Upper-floor roof slab is translucent so the complete plan remains readable.
    // It is drawn before room codes so the codes stay visible without covering the design.
    if (activeFloor === "whole" && upper) {
      const roof = cuboidFaces(-0.25, -0.25, plot.width + 0.5, plot.length + 0.5, FLOOR_HEIGHT + WALL_HEIGHT + 0.25, 0.55);
      roof.sort((a, b) => b.depth - a.depth).forEach((face) => polygon(face.points, "#D8D2C7", "#6B6C66", 0.9, 0.22));
    }

    // Room names are rendered as compact labels inside each room.
    // This changes labels only and leaves the floor-plan geometry untouched.
    geometry.forEach(({ concept, z }) => {
      (concept?.rooms || []).filter((room) => room.type !== "balcony").forEach((room) => {
        const x = safeNumber(room.x);
        const y = safeNumber(room.y);
        const w = safeNumber(room.width);
        const d = safeNumber(room.length);
        if (!(w > 0 && d > 0)) return;

        const point = project(x + w / 2, y + d / 2, z + WALL_HEIGHT + 0.08);
        const label = roomName(room).trim() || "Room";

        // Estimate the room's visible width so labels remain compact.
        const corners = [
          project(x, y, z + WALL_HEIGHT + 0.08),
          project(x + w, y, z + WALL_HEIGHT + 0.08),
          project(x + w, y + d, z + WALL_HEIGHT + 0.08),
          project(x, y + d, z + WALL_HEIGHT + 0.08),
        ];
        const visibleWidth = Math.max(...corners.map((p) => p.x)) -
          Math.min(...corners.map((p) => p.x));
        const maxLabelWidth = Math.max(30, Math.min(86, visibleWidth - 6));

        ctx.save();
        ctx.font = "600 7px Arial, sans-serif";

        // Wrap names onto at most two lines when a room is too narrow.
        const words = label.split(/\\s+/).filter(Boolean);
        const lines = [];
        let currentLine = "";
        words.forEach((word) => {
          const candidate = currentLine ? `${currentLine} ${word}` : word;
          if (currentLine && ctx.measureText(candidate).width > maxLabelWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = candidate;
          }
        });
        if (currentLine) lines.push(currentLine);

        let displayLines = lines;
        if (lines.length > 2) {
          displayLines = [lines[0], lines.slice(1).join(" ")];
        }

        const longestLine = Math.max(...displayLines.map((line) => ctx.measureText(line).width));
        const fontSize = Math.max(5, Math.min(7, (maxLabelWidth - 8) / Math.max(1, longestLine) * 7));
        ctx.font = `600 ${fontSize}px Arial, sans-serif`;

        // Keep the label pill small and translucent so the room remains visible.
        const textWidth = Math.max(...displayLines.map((line) => ctx.measureText(line).width));
        const markerWidth = Math.min(maxLabelWidth, Math.max(24, textWidth + 8));
        const markerHeight = displayLines.length > 1 ? 19 : 12;
        const radius = 4;

        ctx.beginPath();
        ctx.roundRect(
          point.x - markerWidth / 2,
          point.y - markerHeight / 2,
          markerWidth,
          markerHeight,
          radius
        );
        ctx.fillStyle = "rgba(250,248,242,0.78)";
        ctx.fill();
        ctx.strokeStyle = "rgba(83,96,79,0.45)";
        ctx.lineWidth = 0.65;
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(54,66,52,0.98)";

        if (displayLines.length === 1) {
          ctx.fillText(displayLines[0], point.x, point.y + 0.2, markerWidth - 6);
        } else {
          ctx.fillText(displayLines[0], point.x, point.y - 4.2, markerWidth - 6);
          ctx.fillText(displayLines[1], point.x, point.y + 4.2, markerWidth - 6);
        }
        ctx.restore();
      });
    });

        // Soft ground shadow.
    ctx.save();
    ctx.fillStyle = "rgba(80,88,79,0.16)";
    ctx.beginPath();
    ctx.ellipse(width / 2 + 30, height - 55, Math.min(width * 0.36, 340), 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [activeFloor, geometry, pitch, plot.length, plot.width, requirements, upper, yaw, zoom]);

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, yaw, pitch };
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setYaw(dragRef.current.yaw + dx * 0.55);
    setPitch(Math.max(-82, Math.min(88, dragRef.current.pitch - dy * 0.45)));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (event) => {
    event.preventDefault();
    setZoom((value) => Math.max(0.72, Math.min(1.45, value * (event.deltaY < 0 ? 1.06 : 0.94))));
  };

  return (
    <div className="relative overflow-hidden border border-[#D8D5CC] bg-[#E9ECE7]">
      <div className="absolute left-4 top-4 z-30 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
        {[
          ["whole", "Whole Home"],
          ["ground", "Ground Floor"],
          ["upper", "First Floor"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveFloor(value)}
            className={`border px-3 py-2 text-[11px] font-semibold ${
              activeFloor === value
                ? "border-[#53604F] bg-[#53604F] text-white"
                : "border-[#D8D5CC] bg-white text-[#53604F]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="absolute right-4 top-4 z-30 flex max-w-[calc(100%-2rem)] flex-wrap justify-end gap-2">
        <button type="button" onClick={() => { setYaw(0); setPitch(18); }} className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-semibold text-[#53604F]">Front</button>
        <button type="button" onClick={() => { setYaw(90); setPitch(18); }} className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-semibold text-[#53604F]">Side</button>
        <button type="button" onClick={() => { setYaw(0); setPitch(88); }} className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-semibold text-[#53604F]">Top</button>
        <button type="button" onClick={() => rotate(-30)} className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-semibold text-[#53604F]">↶ 30°</button>
        <button type="button" onClick={resetView} className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-semibold text-[#53604F]">Reset</button>
        <button type="button" onClick={() => rotate(30)} className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-semibold text-[#53604F]">30° ↷</button>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-30 border border-[#D8D5CC] bg-white/90 px-3 py-2 text-[10px] text-[#59605A] shadow-sm">
        Drag to rotate · Scroll to zoom · {Math.round(((yaw % 360) + 360) % 360)}° view
      </div>

      <canvas
        ref={canvasRef}
        className="block h-[620px] w-full touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        aria-label="Interactive whole-home 3D architectural visualization"
      />

      <div className="absolute bottom-4 right-4 z-30 rounded-full border border-[#C8C5BA] bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#202421]">
        NORTH
      </div>
    </div>
  );
}

function furnitureFill(type, faceIndex) {
  const palettes = {
    bed: ["#B7A18A", "#8F7A66", "#EDE7DC"],
    sofa: ["#9B9187", "#766D65", "#C6BBB0"],
    dining: ["#8D6849", "#6A4E39", "#B89A78"],
    chair: ["#A27E5E", "#76573F", "#C0A17E"],
    wardrobe: ["#8F765E", "#6B5745", "#B09A82"],
    tv: ["#4A4B47", "#30312E", "#666863"],
    coffee: ["#9A7656", "#6E523D", "#C3A889"],
    desk: ["#927353", "#654C39", "#B59A7C"],
    shelf: ["#8C7157", "#604B39", "#B49A7D"],
    dresser: ["#9A7B5D", "#6B5440", "#BDA184"],
    shoe: ["#92775B", "#604C3C", "#BBA188"],
    fridge: ["#AEB0AD", "#777975", "#D2D3D0"],
    washer: ["#B7B8B4", "#7E807B", "#D8D8D4"],
    appliance: ["#AAA9A4", "#74736F", "#D2D0CA"],
    ac: ["#E5E3DC", "#AAA9A3", "#F3F1EB"],
    purifier: ["#D7DDD8", "#7A8580", "#F0F2ED"],
  };
  const palette = palettes[type] || palettes.appliance;
  return palette[Math.min(faceIndex, palette.length - 1)];
}

function FurnitureInventory({ requirements }) {
  const items = furnitureSource(requirements);

  return (
    <div className="border border-[#E4E1D8] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71806B]">
            Furniture intelligence
          </p>
          <h3 className="mt-1 text-lg font-semibold">Included in the final visualization</h3>
        </div>
        <span className="text-sm font-semibold text-[#53604F]">{items.length} items</span>
      </div>

      {items.length ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const detail = furnitureDetail(requirements, item);
            const size = furnitureSize(requirements, item);
            return (
              <div key={item} className="border border-[#E4E1D8] bg-[#FBFAF7] p-3">
                <div className="text-sm font-semibold">{item}</div>
                <div className="mt-1 text-[11px] text-[#73766F]">
                  {formatNumber(detail.width || size.width)} × {formatNumber(detail.depth || size.depth)} ft
                  {detail.quantity ? ` · Qty ${detail.quantity}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[#73766F]">
          No furniture was selected. The architectural model will still show the complete room structure.
        </p>
      )}
    </div>
  );
}

function FloorSummary({ label, concept }) {
  const rooms = concept?.rooms || [];
  const bedrooms = rooms.filter(isBedroom).length;
  const bathrooms = rooms.filter(isBathroom).length;
  const builtArea = rooms
    .filter((room) => !["balcony", "stair"].includes(roomType(room)))
    .reduce((sum, room) => sum + safeNumber(room.width) * safeNumber(room.length), 0);

  return (
    <div className="border border-[#E4E1D8] bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#71806B]">{label}</p>
          <h3 className="mt-1 text-lg font-semibold">{concept?.title || label}</h3>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold">{formatNumber(builtArea)} ft²</div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#73766F]">conceptual built area</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-[#F7F5EF] p-3 text-center">
          <div className="text-lg font-semibold">{bedrooms}</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-[#73766F]">Bedrooms</div>
        </div>
        <div className="bg-[#F7F5EF] p-3 text-center">
          <div className="text-lg font-semibold">{bathrooms}</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-[#73766F]">Bathrooms</div>
        </div>
        <div className="bg-[#F7F5EF] p-3 text-center">
          <div className="text-lg font-semibold">{rooms.length}</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-[#73766F]">Spaces</div>
        </div>
      </div>
    </div>
  );
}


function detailList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

function DetailList({ title, values, empty = "Not specified" }) {
  const items = detailList(values);
  return (
    <div className="border border-[#E4E1D8] bg-white p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#71806B]">{title}</p>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2 text-xs leading-5 text-[#59605A]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#71806B]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-[#73766F]">{empty}</p>
      )}
    </div>
  );
}

function RoomSchedule({ label, concept, floorPrefix }) {
  const rooms = (concept?.rooms || []).filter((room) => room.type !== "balcony");
  return (
    <div className="border border-[#E4E1D8] bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#71806B]">{label}</p>
          <h3 className="mt-1 text-lg font-semibold">Room Guide</h3>
        </div>
        <span className="text-xs font-semibold text-[#53604F]">{rooms.length} spaces</span>
      </div>
      <div className="mt-4 overflow-hidden border border-[#E4E1D8]">
        {rooms.map((room, index) => (
          <div key={room.id || index} className="grid grid-cols-[48px_1fr_auto] items-start gap-3 border-b border-[#E4E1D8] px-3 py-3 last:border-b-0">
            <div className="flex h-7 w-9 items-center justify-center rounded-full border border-[#C8CFC4] bg-[#F4F5F0] text-[10px] font-bold tracking-[0.08em] text-[#53604F]">{floorPrefix}{index + 1}</div>
            <div>
              <p className="text-xs font-semibold">{room.name}</p>
              <p className="mt-1 text-[10px] leading-4 text-[#73766F]">
                {room.reason || "Purposeful space within the generated concept."}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold">{formatNumber(room.width)} × {formatNumber(room.length)} ft</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#73766F]">{room.type || "space"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalPlanningDetails({ requirements, groundConcept, upperConcept, aiAnalysis, customization }) {
  const preferences = requirements?.preferences || {};
  const furniture = furnitureSource(requirements);
  const groundRooms = groundConcept?.rooms || [];
  const upperRooms = upperConcept?.rooms || [];
  const allRooms = [...groundRooms, ...upperRooms];
  const bedrooms = allRooms.filter(isBedroom).length;
  const bathrooms = allRooms.filter(isBathroom).length;
  const builtArea = allRooms
    .filter((room) => !["balcony", "stair"].includes(roomType(room)))
    .reduce((sum, room) => sum + safeNumber(room.width) * safeNumber(room.length), 0);
  const vastu = upperConcept?.vastuAssessment || groundConcept?.vastuAssessment || null;
  const appliedChanges = customization?.appliedChanges || customization?.changes || [];

  return (
    <>
      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Plot", `${formatNumber(requirements?.plotWidth || groundConcept?.plot?.width)} × ${formatNumber(requirements?.plotLength || groundConcept?.plot?.length)} ft`],
          ["Conceptual built area", `${formatNumber(builtArea)} ft²`],
          ["Bedrooms / Bathrooms", `${bedrooms} / ${bathrooms}`],
          ["Furniture & appliances", `${furniture.length} items`],
        ].map(([label, value]) => (
          <div key={label} className="border border-[#E4E1D8] bg-white p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#73766F]">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <DetailList title="Room relationships" values={preferences.relationships} />
        <DetailList title="Required separations" values={preferences.separations} />
        <DetailList title="Room priorities" values={preferences.priorities} />
        <DetailList title="Lifestyle requirements" values={preferences.lifestyle} />
        <DetailList title="Comfort requirements" values={preferences.comfort} />
        <DetailList title="Special spaces & requirements" values={preferences.specialRequirements} />
        <DetailList title="Highest priority" values={preferences.highestPriority} />
        <DetailList title="Additional user instructions" values={preferences.customRequirements} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border border-[#D8DDD3] bg-[#EEF1EA] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#53604F]">Planning decisions</p>
          <h2 className="mt-2 text-xl font-semibold">Why this concept looks the way it does</h2>
          <div className="mt-4 space-y-3">
            {[...(groundConcept?.planningNotes || []), ...(upperConcept?.planningNotes || [])].slice(0, 8).map((note, index) => (
              <div key={index} className="flex gap-3 text-xs leading-5 text-[#59605A]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#53604F] text-[9px] font-bold text-white">{index + 1}</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#E4E1D8] bg-white p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B86F52]">Vastu & validation</p>
          <h2 className="mt-2 text-xl font-semibold">Planning checks</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-[#F7F5EF] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#73766F]">Vastu score</p>
              <p className="mt-1 text-xl font-semibold">{vastu?.score ?? "—"}</p>
            </div>
            <div className="bg-[#F7F5EF] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#73766F]">Ground validation</p>
              <p className="mt-1 text-sm font-semibold">{groundConcept?.validation?.valid === false ? "Review required" : "Passed / generated"}</p>
            </div>
          </div>
          <DetailList title="Vastu strengths" values={vastu?.strengths} />
          <div className="mt-4">
            <DetailList title="Planning compromises / warnings" values={vastu?.compromises} />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <RoomSchedule label="Ground Floor" concept={groundConcept} floorPrefix="G" />
        <RoomSchedule label="First Floor" concept={upperConcept} floorPrefix="F" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border border-[#E4E1D8] bg-white p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71806B]">Furniture-aware planning</p>
          <h2 className="mt-2 text-xl font-semibold">Your belongings remain part of the concept</h2>
          <p className="mt-2 text-sm leading-6 text-[#73766F]">
            Furniture and appliances supplied during the intake are carried into the visualization layer so the home is evaluated as a lived space, not only as empty rooms.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {furniture.map((item) => (
              <div key={item} className="border border-[#E4E1D8] bg-[#F7F5EF] px-3 py-2 text-xs">{item}</div>
            ))}
          </div>
        </div>

        <div className="border border-[#E4E1D8] bg-white p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71806B]">AI requirement understanding</p>
          <h2 className="mt-2 text-xl font-semibold">Structured planning context</h2>
          <div className="mt-4 space-y-3 text-xs text-[#59605A]">
            <div className="flex justify-between gap-4 border-b border-[#E4E1D8] pb-3"><span>Family / household</span><strong>{requirements?.familySize || requirements?.people || "Not specified"}</strong></div>
            <div className="flex justify-between gap-4 border-b border-[#E4E1D8] pb-3"><span>Budget</span><strong>{requirements?.budget || "Not specified"}</strong></div>
            <div className="flex justify-between gap-4 border-b border-[#E4E1D8] pb-3"><span>Location / climate</span><strong>{requirements?.location || requirements?.climate || "Not specified"}</strong></div>
            <div className="flex justify-between gap-4 border-b border-[#E4E1D8] pb-3"><span>Interior preference</span><strong>{requirements?.interiorStyle || requirements?.style || "Not specified"}</strong></div>
            <div className="flex justify-between gap-4"><span>AI analysis</span><strong>{aiAnalysis ? "Available" : "Not available"}</strong></div>
          </div>
        </div>
      </section>

      {appliedChanges.length > 0 && (
        <section className="mt-8 border border-[#D8DDD3] bg-[#EEF1EA] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#53604F]">Customization completed</p>
          <h2 className="mt-2 text-xl font-semibold">Your selected changes are part of the final concept.</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {appliedChanges.map((change, index) => (
              <span key={index} className="border border-[#B8C2B2] bg-white px-3 py-2 text-xs font-medium">{change}</span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function FinalHomeVisualizationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const requirements = location.state?.requirements || {};
  const aiAnalysis = location.state?.aiAnalysis || null;
  const acceptedConcept =
    location.state?.customizedConcept ||
    location.state?.selectedConcept ||
    location.state?.concept ||
    null;
  const customization = location.state?.customization || {
    appliedChanges: location.state?.appliedChanges || [],
  };

  const groundConcept = useMemo(() => {
    if (!acceptedConcept) return null;
    if (acceptedConcept?.rooms?.length) return clone(acceptedConcept);
    if (acceptedConcept?.floors?.[0]?.rooms?.length) return clone(acceptedConcept.floors[0]);
    return clone(acceptedConcept);
  }, [acceptedConcept]);

  const upperConcept = useMemo(
    () => deriveUpperFloor(requirements, acceptedConcept, aiAnalysis),
    [requirements, acceptedConcept, aiAnalysis]
  );

  const [activeFloor, setActiveFloor] = useState("whole");

  const plot = useMemo(
    () => getPlot(requirements, groundConcept),
    [requirements, groundConcept]
  );

  const furnitureCount = furnitureSource(requirements).length;
  const totalRooms =
    (groundConcept?.rooms?.length || 0) +
    (upperConcept?.rooms?.length || 0);

  if (!groundConcept) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-8 text-[#202421]">
        <div className="mx-auto max-w-3xl border border-[#E4E1D8] bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B86F52]">MyNest</p>
          <h1 className="mt-3 text-3xl font-semibold">No accepted concept was found.</h1>
          <p className="mt-3 text-sm leading-6 text-[#73766F]">
            Return to the concept comparison or customization stage and accept a generated concept before opening the final home visualization.
          </p>
          <button
            type="button"
            onClick={() => navigate("/concept-comparison")}
            className="mt-6 bg-[#202421] px-6 py-3 text-sm font-semibold text-white"
          >
            Back to concept comparison
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">
      <header className="sticky top-0 z-40 border-b border-[#E4E1D8] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-[#53604F]">
            ← Back
          </button>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#71806B]">MyNest</p>
            <p className="mt-1 text-sm font-medium">Final Home Conclusion</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#73766F]">Plot</p>
            <p className="mt-1 text-sm font-semibold">{formatNumber(plot.width)} × {formatNumber(plot.length)} ft</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B86F52]">Where every square feet matters.</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Your personalized home, brought together.</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[#73766F]">
            This is the final planning conclusion: accepted concept geometry, a complete second-floor arrangement, furniture and appliance placement, room schedules, user preferences, planning decisions and Vastu-oriented checks in one place.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="border border-[#E4E1D8] bg-white p-5"><p className="text-[10px] uppercase tracking-[0.15em] text-[#73766F]">Floors</p><p className="mt-2 text-2xl font-semibold">2</p><p className="mt-1 text-xs text-[#73766F]">Ground + first floor</p></div>
          <div className="border border-[#E4E1D8] bg-white p-5"><p className="text-[10px] uppercase tracking-[0.15em] text-[#73766F]">Spaces</p><p className="mt-2 text-2xl font-semibold">{totalRooms}</p><p className="mt-1 text-xs text-[#73766F]">Rooms + circulation</p></div>
          <div className="border border-[#E4E1D8] bg-white p-5"><p className="text-[10px] uppercase tracking-[0.15em] text-[#73766F]">Furniture</p><p className="mt-2 text-2xl font-semibold">{furnitureCount}</p><p className="mt-1 text-xs text-[#73766F]">Captured items & appliances</p></div>
          <div className="border border-[#D8DDD3] bg-[#EEF1EA] p-5"><p className="text-[10px] uppercase tracking-[0.15em] text-[#53604F]">Status</p><p className="mt-2 text-2xl font-semibold text-[#53604F]">Accepted</p><p className="mt-1 text-xs text-[#53604F]">Final concept view</p></div>
        </section>

        <section className="mt-8 overflow-hidden border border-[#D8D5CC] bg-white shadow-[0_18px_50px_rgba(32,36,33,0.07)]">
          <div className="border-b border-[#E4E1D8] px-6 py-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B86F52]">Whole-home 3D visualization</p>
                <h2 className="mt-1 text-2xl font-semibold">{groundConcept.title || "Personalized Home"}</h2>
                <p className="mt-1 text-xs text-[#73766F]">Whole home, ground floor and first floor — with furniture-aware placement and room volumes.</p>
              </div>
              <div className="text-xs text-[#73766F]">Conceptual / Not for construction</div>
            </div>
          </div>
          <OrbitHouse3D ground={groundConcept} upper={upperConcept} requirements={requirements} activeFloor={activeFloor} setActiveFloor={setActiveFloor} />
        </section>

        <FinalPlanningDetails
          requirements={requirements}
          groundConcept={groundConcept}
          upperConcept={upperConcept}
          aiAnalysis={aiAnalysis}
          customization={customization}
        />

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <FloorSummary label="Ground Floor" concept={groundConcept} />
          <FloorSummary label="First Floor" concept={upperConcept} />
        </section>

        <section className="mt-8">
          <FurnitureInventory requirements={requirements} />
        </section>

        <section className="mt-8 border border-[#202421] bg-[#202421] p-7 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C7D1C3]">MyNest conclusion</p>
          <h2 className="mt-2 text-2xl font-semibold">A personalized planning concept — ready for professional architectural development.</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[#D5D8D4]">
            The result combines the supplied plot, household requirements, room relationships, lifestyle preferences, furniture and appliance constraints, selected concept strategy, customization decisions and upper-floor planning into one coordinated conceptual home. Final structural, code, MEP, material and construction decisions must be verified by qualified professionals.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate("/customize-plan")} className="border border-[#C7D1C3] px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Back to customization</button>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="bg-white px-5 py-3 text-sm font-semibold text-[#202421]">Back to 3D view ↑</button>
          </div>
        </section>
      </main>
    </div>
  );
}
