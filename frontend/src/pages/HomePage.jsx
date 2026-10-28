import { Link } from "react-router-dom";

function MyNestLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="42"
          height="42"
          rx="13"
          fill="#F7F5EF"
          stroke="#71806B"
          strokeWidth="1.5"
        />

        <path
          d="M11 29V17L22 9L33 17V29"
          stroke="#202421"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M15 29V20L22 15L29 20V29"
          stroke="#71806B"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M17 27V21L27 27V20"
          stroke="#B86F52"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M11 29H33"
          stroke="#202421"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <div className="leading-none">
        <div className="text-[21px] font-semibold tracking-[0.18em] text-[#202421]">
          MYNEST
        </div>

        <div className="mt-1 text-[8px] font-medium tracking-[0.24em] text-[#73766F]">
          SMART HOME PLANNING
        </div>
      </div>
    </div>
  );
}


/* ---------------------------------------------------------
   ARCHITECTURAL FLOOR PLAN PREVIEW
--------------------------------------------------------- */

function FloorPlanPreview() {
  const rooms = [
    {
      name: "LIVING",
      x: 0,
      y: 0,
      width: 54,
      height: 48,
      background: "#E9E6DD",
    },
    {
      name: "MASTER",
      x: 54,
      y: 0,
      width: 46,
      height: 48,
      background: "#E9E0D2",
    },
    {
      name: "KITCHEN",
      x: 0,
      y: 48,
      width: 34,
      height: 52,
      background: "#E5DED2",
    },
    {
      name: "DINING",
      x: 34,
      y: 48,
      width: 38,
      height: 52,
      background: "#EEEAE0",
    },
    {
      name: "BATH",
      x: 72,
      y: 48,
      width: 28,
      height: 52,
      background: "#DDE7E4",
    },
  ];

  return (
    <div className="relative overflow-hidden border border-[#D8D5CC] bg-[#E3E7DF] shadow-[0_30px_80px_rgba(32,36,33,0.10)]">

      {/* Background architectural grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(#C7CEC1 1px, transparent 1px), linear-gradient(90deg, #C7CEC1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Preview header */}
      <div className="relative flex items-center justify-between border-b border-[#D8D5CC] bg-white/90 px-5 py-4">

        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#71806B]">
            MyNest / Concept 01
          </p>

          <p className="mt-1 text-xs font-medium text-[#202421]">
            Open & Spacious
          </p>
        </div>

        <span className="text-[8px] uppercase tracking-[0.14em] text-[#73766F]">
          Conceptual
        </span>
      </div>


      {/* Floor plan */}
      <div className="relative bg-[#F7F5EF] p-7">

        {/* North */}
        <div className="absolute right-5 top-5 z-10 flex flex-col items-center">
          <span className="text-[8px] font-bold text-[#202421]">
            N
          </span>

          <span className="h-5 w-px bg-[#202421]" />

          <span className="h-0 w-0 border-x-[3px] border-b-[6px] border-x-transparent border-b-[#202421]" />
        </div>


        <div className="relative mx-auto aspect-[1.18] w-full max-w-[520px] border-[3px] border-[#202421] bg-white">

          {rooms.map((room) => (
            <div
              key={room.name}
              className="absolute flex flex-col items-center justify-center border-r-[2px] border-b-[2px] border-[#202421]"
              style={{
                left: `${room.x}%`,
                top: `${room.y}%`,
                width: `${room.width}%`,
                height: `${room.height}%`,
                background: room.background,
              }}
            >

              {room.name === "LIVING" && (
                <div className="mb-3 h-8 w-20 rounded-md border border-[#71806B] bg-white/70" />
              )}

              {room.name === "MASTER" && (
                <div className="mb-3 h-12 w-16 rounded border border-[#B86F52] bg-white/70" />
              )}

              {room.name === "KITCHEN" && (
                <div className="mb-3 flex h-7 w-16 border border-[#71806B] bg-white/60">
                  <span className="flex-1 border-r border-[#71806B]/30" />
                  <span className="flex-1 border-r border-[#71806B]/30" />
                  <span className="flex-1 border-r border-[#71806B]/30" />
                  <span className="flex-1" />
                </div>
              )}

              {room.name === "DINING" && (
                <div className="mb-3 h-7 w-16 rounded-full border border-[#8E6C4D] bg-white/70" />
              )}

              {room.name === "BATH" && (
                <div className="mb-3 h-8 w-7 rounded-full border border-[#687A75] bg-white/70" />
              )}

              <span className="text-[8px] font-semibold tracking-[0.12em] text-[#202421]">
                {room.name}
              </span>

              <span className="mt-1 text-[7px] text-[#73766F]">
                {room.name === "LIVING" || room.name === "MASTER"
                  ? "12 × 14 ft"
                  : "8 × 10 ft"}
              </span>
            </div>
          ))}

          {/* Entrance */}
          <div className="absolute bottom-[-3px] left-1/2 h-1.5 w-12 -translate-x-1/2 bg-[#202421]" />
        </div>
      </div>


      {/* Information strip */}
      <div className="relative grid grid-cols-3 divide-x divide-[#E4E1D8] bg-white">

        <div className="px-3 py-4 text-center">
          <p className="text-[9px] uppercase tracking-[0.12em] text-[#73766F]">
            Plot
          </p>

          <p className="mt-1 text-xs font-semibold">
            30 × 50 ft
          </p>
        </div>

        <div className="px-3 py-4 text-center">
          <p className="text-[9px] uppercase tracking-[0.12em] text-[#73766F]">
            Home
          </p>

          <p className="mt-1 text-xs font-semibold">
            2 BHK
          </p>
        </div>

        <div className="px-3 py-4 text-center">
          <p className="text-[9px] uppercase tracking-[0.12em] text-[#73766F]">
            Planning
          </p>

          <p className="mt-1 text-xs font-semibold">
            Personalized
          </p>
        </div>

      </div>
    </div>
  );
}


/* ---------------------------------------------------------
   SMALL FEATURE
--------------------------------------------------------- */

function Feature({
  number,
  title,
  description,
}) {
  return (
    <div className="border border-[#E4E1D8] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#71806B] hover:shadow-[0_18px_45px_rgba(32,36,33,0.06)]">

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[0.18em] text-[#B86F52]">
          {number}
        </span>

        <span className="text-[#C9C6BC]">
          ↗
        </span>
      </div>

      <h3 className="mt-8 text-lg font-semibold text-[#202421]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#73766F]">
        {description}
      </p>
    </div>
  );
}


/* ---------------------------------------------------------
   HOMEPAGE
--------------------------------------------------------- */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#E4E1D8] bg-[#F7F5EF]/95 backdrop-blur-md">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link to="/" aria-label="MyNest home">
            <MyNestLogo />
          </Link>


          <nav className="hidden items-center gap-9 text-sm text-[#73766F] md:flex">

            <a
              href="#how-it-works"
              className="transition hover:text-[#202421]"
            >
              How it works
            </a>

            <a
              href="#features"
              className="transition hover:text-[#202421]"
            >
              Features
            </a>

            <a
              href="#why-mynest"
              className="transition hover:text-[#202421]"
            >
              Why MyNest
            </a>

          </nav>


          <div className="flex items-center gap-5">

            <Link
              to="/login"
              className="hidden text-sm text-[#73766F] transition hover:text-[#202421] sm:block"
            >
              Sign in
            </Link>

            <Link
              to="/login"
              className="rounded-full bg-[#202421] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#53604F]"
            >
              Start Planning
            </Link>

          </div>

        </div>
      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <main>

        <section className="relative overflow-hidden border-b border-[#E4E1D8]">

          {/* Architectural grid */}
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                "linear-gradient(#BFC4B9 1px, transparent 1px), linear-gradient(90deg, #BFC4B9 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
          />

          {/* Large architectural circles */}
          <div className="absolute -left-40 top-20 h-[520px] w-[520px] rounded-full border border-[#71806B]/10" />

          <div className="absolute -right-48 -top-48 h-[650px] w-[650px] rounded-full border border-[#B86F52]/10" />


          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:min-h-[calc(100vh-73px)] lg:grid-cols-[0.88fr_1.12fr] lg:py-16">

            {/* Hero text */}
            <div>

              <div className="mb-7 flex items-center gap-3">

                <span className="h-px w-9 bg-[#71806B]" />

                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#71806B]">
                  AI-powered personalized home planning
                </p>

              </div>


              <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-[4.6rem]">

                Design the home

                <span className="block text-[#53604F]">
                  around your life.
                </span>

              </h1>


              <p className="mt-7 max-w-xl text-[17px] leading-8 text-[#73766F]">
                MyNest brings together your plot, budget, lifestyle,
                room priorities, furniture and future needs to create
                personalized home-planning concepts.
              </p>


              <div className="mt-8 flex flex-wrap gap-3">

                <Link
                  to="/login"
                  className="rounded-full bg-[#202421] px-7 py-3.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#53604F]"
                >
                  Start Planning →
                </Link>

                <a
                  href="#how-it-works"
                  className="rounded-full border border-[#D6D3C9] bg-white/80 px-7 py-3.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white"
                >
                  See how it works
                </a>

              </div>


              <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#73766F]">

                <span>Plot-aware</span>

                <span className="text-[#C8C5BA]">•</span>

                <span>Budget-aware</span>

                <span className="text-[#C8C5BA]">•</span>

                <span>Furniture-aware</span>

                <span className="text-[#C8C5BA]">•</span>

                <span>Preference-aware</span>

              </div>


              <div className="mt-10 border-l-2 border-[#71806B] pl-4">

                <p className="text-xs leading-5 text-[#73766F]">

                  <span className="font-medium text-[#202421]">
                    Where every square feet matters.
                  </span>

                  {" "}
                  One planning system for your space,
                  budget and lifestyle.

                </p>

              </div>

            </div>


            {/* Floor plan */}
            <div className="relative">

              <div className="mb-3 flex items-center justify-end gap-2">

                <span className="h-px w-8 bg-[#C8C5BA]" />

                <span className="text-[9px] uppercase tracking-[0.2em] text-[#73766F]">
                  Personalized concept / 01
                </span>

              </div>


              <FloorPlanPreview />


              <div className="mt-3 flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-[#9A9A91]">

                <span>
                  Conceptual / not for construction
                </span>

                <span>
                  MN — 01
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            THE IDEA
        ===================================================== */}

        <section className="border-b border-[#E4E1D8] bg-white">

          <div className="mx-auto max-w-7xl px-6 py-20">

            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
                  The idea behind MyNest
                </p>

                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                  A home is more than a collection of rooms.
                </h2>

              </div>


              <div>

                <p className="text-base leading-8 text-[#73766F]">
                  Your home needs to work with the way you actually
                  live. MyNest considers the space available, the people
                  using it, the things you own and the priorities that
                  matter to you.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">

                  {[
                    "Plot",
                    "People",
                    "Lifestyle",
                    "Priorities",
                    "Furniture",
                    "Future",
                  ].map((item) => (
                    <span
                      key={item}
                      className="border border-[#D8D5CC] bg-[#F7F5EF] px-4 py-2 text-xs text-[#53604F]"
                    >
                      {item}
                    </span>
                  ))}

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section
          id="how-it-works"
          className="border-b border-[#E4E1D8]"
        >

          <div className="mx-auto max-w-7xl px-6 py-20">

            <div className="max-w-2xl">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
                How it works
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                From what you need to how your home can work.
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#73766F]">
                MyNest first understands your requirements and then
                uses a spatial planning layer to develop conceptual
                home-planning alternatives.
              </p>

            </div>


            <div className="mt-10 grid gap-4 md:grid-cols-4">

              <Feature
                number="01"
                title="Tell us about your home"
                description="Plot, budget, family size and basic room requirements."
              />

              <Feature
                number="02"
                title="Personalize it"
                description="Describe relationships, privacy, lifestyle and special requirements."
              />

              <Feature
                number="03"
                title="Add what you own"
                description="Include furniture, appliances and dimensions that matter."
              />

              <Feature
                number="04"
                title="Explore concepts"
                description="Compare planning strategies and refine the concept you prefer."
              />

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURES
        ===================================================== */}

        <section
          id="features"
          className="border-b border-[#E4E1D8] bg-[#F7F5EF]"
        >

          <div className="mx-auto max-w-7xl px-6 py-20">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

              <div className="max-w-2xl">

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
                  Built around your needs
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                  More than a floor-plan generator.
                </h2>

              </div>


              <p className="max-w-md text-sm leading-6 text-[#73766F]">
                MyNest connects different planning decisions instead
                of treating every part of the home as a separate tool.
              </p>

            </div>


            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              <Feature
                number="01"
                title="Personalized planning"
                description="Room priorities, lifestyle, privacy and natural-language requirements become part of the planning brief."
              />

              <Feature
                number="02"
                title="Multiple concepts"
                description="Explore different strategies such as open, privacy-focused and space-efficient planning."
              />

              <Feature
                number="03"
                title="Furniture-aware"
                description="Plan around furniture and appliance dimensions instead of forcing them into the finished layout."
              />

              <Feature
                number="04"
                title="Vastu-oriented"
                description="Apply supplied directional rules as conceptual planning constraints."
              />

              <Feature
                number="05"
                title="Multi-floor planning"
                description="Explore how spaces can be distributed across multiple floors as the planning engine evolves."
              />

              <Feature
                number="06"
                title="Future-ready"
                description="Build toward sustainability, cost alternatives, what-if analysis and advanced visualization."
              />

            </div>

          </div>

        </section>


        {/* =====================================================
            WHY MYNEST
        ===================================================== */}

        <section
          id="why-mynest"
          className="bg-[#202421] text-white"
        >

          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B8C5AF]">
                The MyNest idea
              </p>

              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Design the home around the person,
                not just the plot.
              </h2>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65">
                A useful home is not defined only by how many rooms
                fit inside its boundary. Relationships, circulation,
                privacy, furniture, budget and the way people actually
                live matter too.
              </p>

            </div>


            <div className="border border-white/10 bg-white/[0.04] p-7">

              <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">

                {[
                  ["Plot", "Where can it fit?"],
                  ["People", "Who will use it?"],
                  ["Lifestyle", "How will they live?"],
                  ["Future", "What comes next?"],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="bg-[#202421] p-5"
                  >

                    <p className="text-xs font-semibold">
                      {title}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/55">
                      {description}
                    </p>

                  </div>
                ))}

              </div>


              <Link
                to="/login"
                className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-[#202421] transition hover:bg-[#E9E7DF]"
              >
                Start with your requirements →
              </Link>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="bg-[#F7F5EF]">

          <div className="mx-auto max-w-7xl px-6 py-16">

            <div className="flex flex-col items-start justify-between gap-6 border border-[#D8D5CC] bg-white p-8 md:flex-row md:items-center">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
                  Ready when you are
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Start planning a home that feels like yours.
                </h2>

                <p className="mt-2 text-sm text-[#73766F]">
                  Conceptual planning support — not construction drawings.
                </p>

              </div>


              <Link
                to="/login"
                className="shrink-0 rounded-full bg-[#53604F] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#43503F]"
              >
                Start Planning →
              </Link>

            </div>


            <div className="mt-8 flex flex-col gap-3 border-t border-[#E4E1D8] pt-6 text-[10px] uppercase tracking-[0.12em] text-[#9A9A91] md:flex-row md:items-center md:justify-between">

              <span>
                MyNest · Intelligent Home Planning
              </span>

              <span>
                Where every square feet matters.
              </span>

              <span>
                Conceptual / Not for construction
              </span>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}