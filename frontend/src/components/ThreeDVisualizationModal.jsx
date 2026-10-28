import { useEffect, useMemo, useState } from "react";

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number % 1 === 0 ? String(number) : number.toFixed(1);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function screenRect(room, plot) {
  const x = safeNumber(room.x);
  const y = plot.length - safeNumber(room.y) - safeNumber(room.length);

  return {
    x,
    y,
    width: Math.max(0.1, safeNumber(room.width)),
    height: Math.max(0.1, safeNumber(room.length)),
  };
}

function roomFill(type) {
  switch (type) {
    case "bedroom":
      return "#EEE8DD";
    case "kitchen":
      return "#E9E3D7";
    case "bathroom":
      return "#DCE6E2";
    case "pooja":
      return "#EFE5D3";
    case "dining":
      return "#EDE9DF";
    case "living":
      return "#E7E4DA";
    default:
      return "#ECEAE3";
  }
}

function RoomLabel({ room, rect }) {
  const shortName = room.name?.replace(" Bedroom", "") || "Room";
  const label =
    shortName.length > 18 ? `${shortName.slice(0, 17)}…` : shortName;

  return (
    <>
      <text
        x={rect.x + rect.width / 2}
        y={rect.y + rect.height / 2 - 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.max(0.55, Math.min(1.05, rect.width / 15))}
        fontWeight="700"
        fill="#3A3C38"
        pointerEvents="none"
      >
        {label}
      </text>

      <text
        x={rect.x + rect.width / 2}
        y={rect.y + rect.height / 2 + 1.6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.max(0.42, Math.min(0.72, rect.width / 22))}
        fill="#74766F"
        pointerEvents="none"
      >
        {formatNumber(room.width)} × {formatNumber(room.length)} ft
      </text>
    </>
  );
}

function Furniture({ room, rect }) {
  const type = room.type;
  const x = rect.x;
  const y = rect.y;
  const w = rect.width;
  const h = rect.height;

  const scale = Math.min(w, h) / 10;
  const s = Math.max(0.55, Math.min(1.25, scale));

  if (type === "bedroom") {
    const bedW = Math.min(w * 0.52, 7 * s);
    const bedH = Math.min(h * 0.34, 7.5 * s);
    const bedX = x + w * 0.5 - bedW / 2;
    const bedY = y + h * 0.14;
    const wardrobeW = Math.min(w * 0.16, 3.2 * s);

    return (
      <g opacity="0.94" pointerEvents="none">
        <rect
          x={bedX}
          y={bedY}
          width={bedW}
          height={bedH}
          rx="0.45"
          fill="#C8B7A2"
          stroke="#8F806F"
          strokeWidth="0.18"
        />

        <rect
          x={bedX + bedW * 0.08}
          y={bedY + bedH * 0.07}
          width={bedW * 0.84}
          height={bedH * 0.22}
          rx="0.25"
          fill="#F4F0E8"
        />

        <rect
          x={bedX + bedW * 0.12}
          y={bedY + bedH * 0.31}
          width={bedW * 0.76}
          height={bedH * 0.62}
          rx="0.3"
          fill="#D9CFC1"
        />

        <rect
          x={x + w - wardrobeW - 0.55}
          y={y + 0.65}
          width={wardrobeW}
          height={h * 0.18}
          fill="#8D765F"
          stroke="#655444"
          strokeWidth="0.18"
        />

        <rect
          x={bedX - 0.65}
          y={bedY + bedH * 0.1}
          width="0.45"
          height="1.3"
          fill="#A58F78"
        />

        <rect
          x={bedX + bedW + 0.2}
          y={bedY + bedH * 0.1}
          width="0.45"
          height="1.3"
          fill="#A58F78"
        />
      </g>
    );
  }

  if (type === "living") {
    const sofaW = Math.min(w * 0.58, 9.5 * s);
    const sofaH = Math.min(h * 0.16, 2.3 * s);
    const sofaX = x + w * 0.16;
    const sofaY = y + h * 0.17;

    return (
      <g opacity="0.96" pointerEvents="none">
        <rect
          x={sofaX}
          y={sofaY}
          width={sofaW}
          height={sofaH}
          rx="0.55"
          fill="#B7A89A"
          stroke="#766A5D"
          strokeWidth="0.2"
        />

        <rect
          x={sofaX}
          y={sofaY}
          width={sofaH}
          height={h * 0.42}
          rx="0.45"
          fill="#A59585"
        />

        <rect
          x={sofaX + sofaW * 0.72}
          y={sofaY}
          width={sofaH}
          height={h * 0.42}
          rx="0.45"
          fill="#A59585"
        />

        <rect
          x={x + w * 0.36}
          y={y + h * 0.48}
          width={Math.min(w * 0.26, 4.4 * s)}
          height={Math.min(h * 0.18, 2.1 * s)}
          rx="0.35"
          fill="#C9B79F"
          stroke="#887864"
          strokeWidth="0.18"
        />

        <rect
          x={x + w * 0.42}
          y={y + h * 0.04}
          width={Math.min(w * 0.22, 3.8 * s)}
          height="0.38"
          fill="#5C5D58"
        />
      </g>
    );
  }

  if (type === "dining") {
    const tableW = Math.min(w * 0.46, 7 * s);
    const tableH = Math.min(h * 0.24, 3.1 * s);
    const tx = x + w / 2 - tableW / 2;
    const ty = y + h / 2 - tableH / 2;

    return (
      <g opacity="0.96" pointerEvents="none">
        <rect
          x={tx}
          y={ty}
          width={tableW}
          height={tableH}
          rx="0.5"
          fill="#8F6E4F"
          stroke="#664C38"
          strokeWidth="0.2"
        />

        {[
          [tx - 0.9, ty + tableH * 0.15],
          [tx - 0.9, ty + tableH * 0.68],
          [tx + tableW + 0.45, ty + tableH * 0.15],
          [tx + tableW + 0.45, ty + tableH * 0.68],
        ].map(([cx, cy], index) => (
          <rect
            key={index}
            x={cx}
            y={cy}
            width="0.45"
            height="0.9"
            rx="0.18"
            fill="#75604D"
          />
        ))}
      </g>
    );
  }

  if (type === "kitchen") {
    const counter = Math.min(2.2, w * 0.18);

    return (
      <g opacity="0.96" pointerEvents="none">
        <rect
          x={x + 0.55}
          y={y + 0.55}
          width={Math.max(1.2, w - 1.1)}
          height={counter}
          fill="#9A8976"
          stroke="#675C50"
          strokeWidth="0.18"
        />

        <rect
          x={x + 0.7}
          y={y + 0.85}
          width="1.25"
          height="0.85"
          rx="0.12"
          fill="#D7D2C9"
        />

        <circle
          cx={x + w * 0.52}
          cy={y + 1.3}
          r="0.34"
          fill="#565854"
        />

        <circle
          cx={x + w * 0.66}
          cy={y + 1.3}
          r="0.34"
          fill="#565854"
        />

        <rect
          x={x + 0.7}
          y={y + h - 2.1}
          width={Math.max(2.2, w * 0.26)}
          height="1.35"
          fill="#C6B9A8"
          stroke="#75685A"
          strokeWidth="0.18"
        />

        <rect
          x={x + w - 1.8}
          y={y + 1.0}
          width="1.05"
          height={Math.max(2.8, h * 0.34)}
          fill="#B6B4AC"
          stroke="#686863"
          strokeWidth="0.18"
        />
      </g>
    );
  }

  if (type === "bathroom") {
    return (
      <g opacity="0.92" pointerEvents="none">
        <circle
          cx={x + w * 0.28}
          cy={y + h * 0.28}
          r={Math.min(0.8, w * 0.14)}
          fill="#F3F2ED"
          stroke="#777A74"
          strokeWidth="0.18"
        />

        <rect
          x={x + w * 0.56}
          y={y + h * 0.17}
          width={Math.min(1.45, w * 0.25)}
          height={Math.min(2.0, h * 0.28)}
          rx="0.35"
          fill="#F3F2ED"
          stroke="#777A74"
          strokeWidth="0.18"
        />

        <rect
          x={x + 0.5}
          y={y + h * 0.58}
          width={Math.max(1.6, w * 0.28)}
          height={Math.max(1.6, h * 0.28)}
          fill="#C8D9D4"
          stroke="#687873"
          strokeWidth="0.18"
        />
      </g>
    );
  }

  if (type === "pooja") {
    return (
      <g opacity="0.96" pointerEvents="none">
        <rect
          x={x + w * 0.2}
          y={y + h * 0.16}
          width={w * 0.6}
          height={h * 0.16}
          fill="#8E6E4C"
        />

        <path
          d={`M ${x + w * 0.5} ${y + h * 0.42} l 0.55 0.9 l -1.1 0 z`}
          fill="#B86F52"
        />

        <circle
          cx={x + w * 0.5}
          cy={y + h * 0.54}
          r="0.35"
          fill="#C89B4A"
        />
      </g>
    );
  }

  return null;
}

function DoorSymbol({ rect, side = "bottom" }) {
  const door = Math.max(
    2.6,
    Math.min(4.0, Math.min(rect.width, rect.height) * 0.28)
  );

  const wall = "#4B4D48";

  if (side === "left") {
    const x = rect.x;
    const y = rect.y + rect.height * 0.62;

    return (
      <g pointerEvents="none">
        <line
          x1={x}
          y1={y}
          x2={x}
          y2={y + door}
          stroke="#F5F2EA"
          strokeWidth="0.7"
        />

        <path
          d={`M ${x} ${y + door} A ${door} ${door} 0 0 1 ${x + door} ${y}`}
          fill="none"
          stroke={wall}
          strokeWidth="0.16"
        />
      </g>
    );
  }

  const x = rect.x + rect.width * 0.55;
  const y = rect.y + rect.height;

  return (
    <g pointerEvents="none">
      <line
        x1={x}
        y1={y}
        x2={x + door}
        y2={y}
        stroke="#F5F2EA"
        strokeWidth="0.7"
      />

      <path
        d={`M ${x} ${y} A ${door} ${door} 0 0 1 ${x + door} ${y - door}`}
        fill="none"
        stroke={wall}
        strokeWidth="0.16"
      />
    </g>
  );
}

function WindowSymbols({ rect }) {
  return (
    <g pointerEvents="none" opacity="0.95">
      <line
        x1={rect.x + rect.width * 0.22}
        y1={rect.y}
        x2={rect.x + rect.width * 0.55}
        y2={rect.y}
        stroke="#7D9AA0"
        strokeWidth="0.75"
      />

      <line
        x1={rect.x + rect.width * 0.7}
        y1={rect.y + rect.height}
        x2={rect.x + rect.width * 0.9}
        y2={rect.y + rect.height}
        stroke="#7D9AA0"
        strokeWidth="0.75"
      />
    </g>
  );
}

function Plant({ x, y, scale = 1 }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      pointerEvents="none"
    >
      <circle cx="0" cy="0" r="0.75" fill="#6E7F63" />
      <circle cx="-0.7" cy="0.35" r="0.55" fill="#829171" />
      <circle cx="0.7" cy="0.35" r="0.55" fill="#829171" />
      <rect x="-0.35" y="0.5" width="0.7" height="0.7" fill="#9A765B" />
    </g>
  );
}

function RenderedPlan({ concept, plot, selectedRoom, onSelectRoom }) {
  const rooms = concept?.rooms || [];

  const padding = 5;
  const width = plot.width + padding * 2;
  const height = plot.length + padding * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      role="img"
      aria-label="Rendered conceptual 3D-style residential floor plan"
    >
      <defs>
        <filter
          id="mn-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0.35"
            dy="0.65"
            stdDeviation="0.45"
            floodOpacity="0.18"
          />
        </filter>

        <pattern
          id="mn-tile"
          width="2.4"
          height="2.4"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 2.4 0 L 0 0 0 2.4"
            fill="none"
            stroke="#D8D5CC"
            strokeWidth="0.08"
          />
        </pattern>
      </defs>

      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="#DCE5D2"
      />

      <rect
        x={padding - 1.4}
        y={padding - 1.4}
        width={plot.width + 2.8}
        height={plot.length + 2.8}
        rx="0.8"
        fill="#B9B7AE"
        opacity="0.5"
      />

      <g transform={`translate(${padding} ${padding})`}>
        <rect
          x="0"
          y="0"
          width={plot.width}
          height={plot.length}
          fill="#F1EEE6"
          filter="url(#mn-shadow)"
        />

        <rect
          x="0"
          y="0"
          width={plot.width}
          height={plot.length}
          fill="url(#mn-tile)"
          opacity="0.32"
        />

        {rooms.map((room) => {
          const rect = screenRect(room, plot);
          const selected = room.id === selectedRoom;

          return (
            <g
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className="cursor-pointer"
            >
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill={roomFill(room.type)}
                stroke={selected ? "#53604F" : "#4B4D48"}
                strokeWidth={selected ? "0.65" : "0.42"}
                filter="url(#mn-shadow)"
              />

              <rect
                x={rect.x + 0.45}
                y={rect.y + 0.45}
                width={Math.max(0.1, rect.width - 0.9)}
                height={Math.max(0.1, rect.height - 0.9)}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="0.12"
                opacity="0.65"
              />

              <Furniture room={room} rect={rect} />

              <WindowSymbols rect={rect} />

              <DoorSymbol
                rect={rect}
                side={room.type === "bathroom" ? "left" : "bottom"}
              />

              <RoomLabel room={room} rect={rect} />
            </g>
          );
        })}

        <Plant x={1.4} y={1.4} scale={1.15} />
        <Plant x={plot.width - 1.4} y={1.4} scale={1.15} />
        <Plant x={1.4} y={plot.length - 1.4} scale={1.15} />
        <Plant
          x={plot.width - 1.4}
          y={plot.length - 1.4}
          scale={1.15}
        />

        <g opacity="0.95" pointerEvents="none">
          <line
            x1={plot.width - 4.4}
            y1={plot.length + 0.05}
            x2={plot.width - 0.9}
            y2={plot.length + 0.05}
            stroke="#7A756D"
            strokeWidth="1.5"
          />

          <path
            d={`M ${
              plot.width - 2.65
            } ${plot.length + 0.05} l 0.8 -0.55 l 0 1.1 z`}
            fill="#7A756D"
          />
        </g>
      </g>

      <g
        transform={`translate(${width - 4.2} 2.3)`}
        pointerEvents="none"
      >
        <circle
          cx="0"
          cy="0"
          r="1.35"
          fill="#FFFFFF"
          stroke="#5D625A"
          strokeWidth="0.16"
        />

        <path
          d="M 0 -0.9 L 0.45 0.3 L 0 0.05 L -0.45 0.3 Z"
          fill="#5D625A"
        />

        <text
          x="0"
          y="2.4"
          textAnchor="middle"
          fontSize="0.8"
          fill="#5D625A"
        >
          N
        </text>
      </g>
    </svg>
  );
}

export default function ThreeDVisualizationModal({
  concept,
  plot,
  onClose,
}) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [view, setView] = useState("render");

  // 360 degree rotation
  const [rotation, setRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);

  const safePlot = useMemo(
    () => ({
      width: Math.max(1, safeNumber(plot?.width, 30)),
      length: Math.max(1, safeNumber(plot?.length, 40)),
    }),
    [plot]
  );

  const rooms = useMemo(() => {
    return (concept?.rooms || []).filter(
      (room) =>
        Number(room?.width) > 0 &&
        Number(room?.length) > 0 &&
        Number.isFinite(Number(room?.x)) &&
        Number.isFinite(Number(room?.y))
    );
  }, [concept]);

  const activeRoom = rooms.find((room) => room.id === selectedRoom);

  // Automatically rotate the visualization.
  useEffect(() => {
    if (!autoRotate) return;

    const timer = window.setInterval(() => {
      setRotation((current) => (current + 1) % 360);
    }, 45);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRotate]);

  const rotateLeft = () => {
    setRotation((current) => (current - 15 + 360) % 360);
  };

  const rotateRight = () => {
    setRotation((current) => (current + 15) % 360);
  };

  const resetRotation = () => {
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#202421]/75 p-3 backdrop-blur-[2px] md:p-5">
      <div className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden border border-[#D8D5CC] bg-[#F7F5EF] shadow-2xl">

        <header className="flex items-center justify-between border-b border-[#E4E1D8] bg-white px-5 py-4 md:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
              3D Floor Plan
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#202421]">
              {concept?.title || "Selected Concept"}
            </h2>

            <p className="mt-1 text-xs text-[#73766F]">
              Furnished top-down architectural visualization based on the generated spatial layout.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-[#D8D5CC] bg-white px-4 py-2 text-sm font-medium text-[#53604F] hover:border-[#53604F]"
          >
            Close
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-auto lg:flex-row">

          <div className="relative min-h-[560px] flex-1 overflow-hidden bg-[#DCE1D8] p-4 md:p-6">

            {/* View controls */}
            <div className="absolute left-5 top-5 z-20 flex flex-wrap gap-2">

              {[
                ["render", "Rendered plan"],
                ["top", "Clean top view"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={[
                    "border px-3 py-2 text-[11px] font-medium shadow-sm",
                    view === id
                      ? "border-[#53604F] bg-[#53604F] text-white"
                      : "border-[#D8D5CC] bg-white text-[#53604F]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}

              {/* 360 controls */}
              <button
                type="button"
                onClick={rotateLeft}
                className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-medium text-[#53604F] shadow-sm hover:border-[#53604F]"
                title="Rotate left"
              >
                ↶
              </button>

              <button
                type="button"
                onClick={rotateRight}
                className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-medium text-[#53604F] shadow-sm hover:border-[#53604F]"
                title="Rotate right"
              >
                ↷
              </button>

              <button
                type="button"
                onClick={resetRotation}
                className="border border-[#D8D5CC] bg-white px-3 py-2 text-[11px] font-medium text-[#53604F] shadow-sm hover:border-[#53604F]"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setAutoRotate((value) => !value)}
                className={[
                  "border px-3 py-2 text-[11px] font-semibold shadow-sm",
                  autoRotate
                    ? "border-[#B86F52] bg-[#B86F52] text-white"
                    : "border-[#D8D5CC] bg-white text-[#53604F]",
                ].join(" ")}
              >
                {autoRotate ? "Stop 360°" : "360° Auto Turn"}
              </button>
            </div>

            {/* Rotation information */}
            <div className="absolute right-5 top-5 z-20 border border-[#D8D5CC] bg-white/95 px-3 py-2 text-[10px] font-medium text-[#53604F] shadow-sm">
              Rotation: {rotation}°
            </div>

            <div className="flex h-full min-h-[520px] items-center justify-center overflow-auto pt-14">

              <div
                className="w-full max-w-[820px]"
                style={{
                  perspective: "1400px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    transformStyle: "preserve-3d",
                    transform:
                      view === "render"
                        ? `rotateX(2deg) rotateZ(${rotation * 0.12}deg) rotateY(${rotation * 0.32}deg)`
                        : `rotateY(${rotation * 0.18}deg)`,
                    transition: autoRotate
                      ? "none"
                      : "transform 220ms ease-out",
                  }}
                >
                  {view === "render" ? (
                    <RenderedPlan
                      concept={concept}
                      plot={safePlot}
                      selectedRoom={selectedRoom}
                      onSelectRoom={setSelectedRoom}
                    />
                  ) : (
                    <div className="relative mx-auto max-w-[760px] border-2 border-[#3F423D] bg-[#F1EEE6] p-1 shadow-xl">
                      <RenderedPlan
                        concept={concept}
                        plot={safePlot}
                        selectedRoom={selectedRoom}
                        onSelectRoom={setSelectedRoom}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-5 max-w-lg border border-[#D8D5CC] bg-white/92 px-4 py-3 text-[11px] leading-5 text-[#73766F] shadow-sm backdrop-blur">
              <strong className="font-semibold text-[#202421]">
                Conceptual visualization.
              </strong>{" "}
              The rooms, dimensions and positions come from the selected MyNest plan. Furniture and architectural details are illustrative and are not construction drawings.
            </div>
          </div>

          <aside className="w-full border-t border-[#E4E1D8] bg-white p-5 md:p-6 lg:w-80 lg:border-l lg:border-t-0">

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71806B]">
              Selected concept
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              {concept?.title || "Selected Concept"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#73766F]">
              {concept?.summary ||
                "Generated from your planning requirements."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <div className="border border-[#E4E1D8] p-3">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#73766F]">
                  Plot
                </p>

                <p className="mt-1 text-base font-semibold">
                  {formatNumber(safePlot.width)} ×{" "}
                  {formatNumber(safePlot.length)} ft
                </p>
              </div>

              <div className="border border-[#E4E1D8] p-3">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#73766F]">
                  Rooms
                </p>

                <p className="mt-1 text-base font-semibold">
                  {rooms.length}
                </p>
              </div>
            </div>

            <div className="mt-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71806B]">
                Rooms & furniture
              </p>

              <div className="mt-3 max-h-64 space-y-1 overflow-auto">

                {rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoom(room.id)}
                    className={[
                      "flex w-full items-center justify-between border px-3 py-2 text-left text-xs",
                      selectedRoom === room.id
                        ? "border-[#53604F] bg-[#F3F6F1]"
                        : "border-[#E4E1D8] hover:border-[#71806B]",
                    ].join(" ")}
                  >
                    <span className="truncate font-medium">
                      {room.name}
                    </span>

                    <span className="ml-3 shrink-0 text-[#73766F]">
                      {formatNumber(room.width)} ×{" "}
                      {formatNumber(room.length)}
                    </span>
                  </button>
                ))}

              </div>
            </div>

            {activeRoom && (
              <div className="mt-5 border border-[#E4E1D8] bg-[#F7F5EF] p-4">

                <p className="text-[9px] uppercase tracking-[0.15em] text-[#B86F52]">
                  Planning reason
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {activeRoom.name}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#73766F]">
                  {activeRoom.planningReason ||
                    "Positioned according to the selected spatial planning strategy."}
                </p>

              </div>
            )}

            <div className="mt-5 border border-[#D8D5CC] bg-[#FBFAF7] p-4">

              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#53604F]">
                360° visualization
              </p>

              <p className="mt-2 text-xs leading-5 text-[#73766F]">
                Use the ↶ and ↷ buttons for controlled rotation, or use
                <strong className="text-[#202421]"> 360° Auto Turn </strong>
                to continuously rotate the architectural visualization.
              </p>

            </div>

            <div className="mt-5 border border-[#D8D5CC] bg-[#FBFAF7] p-4">

              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#53604F]">
                Reference style
              </p>

              <p className="mt-2 text-xs leading-5 text-[#73766F]">
                Furnished room blocks, visible walls, door swings, windows,
                floor finishes, greenery and room-wise furniture are
                represented in the same visual language as the reference
                plans.
              </p>

            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}