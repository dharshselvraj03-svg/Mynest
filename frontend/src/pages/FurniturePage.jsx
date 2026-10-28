import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const furnitureOptions = [
  "Sofa",
  "TV / TV Unit",
  "Coffee Table",
  "Dining Table",
  "Dining Chairs",
  "Bed",
  "Wardrobe",
  "Study Table",
  "Bookshelf",
  "Dressing Table",
  "Shoe Rack",
]

const applianceOptions = [
  "Refrigerator",
  "Washing Machine",
  "Microwave",
  "Oven",
  "Dishwasher",
  "Air Conditioner",
  "Cooler",
  "Water Purifier",
  "TV",
]

function SectionHeader({ number, title, description }) {
  return (
    <div className="mb-7 flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#202421] text-sm font-semibold text-white">
        {number}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#202421]">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#73766F]">
          {description}
        </p>
      </div>
    </div>
  )
}

function OptionCard({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-[#53604F] bg-[#EEF1EA] text-[#202421]"
          : "border-[#E4E1D8] bg-white text-[#4D514C] hover:border-[#71806B]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-[#53604F] bg-[#53604F]"
              : "border-[#BFC1BA]"
          }`}
        >
          {selected && (
            <span className="h-2 w-2 rounded-full bg-white" />
          )}
        </span>

        <span className="text-sm font-medium">
          {label}
        </span>
      </div>
    </button>
  )
}

function FurniturePage() {
  const navigate = useNavigate()
  const location = useLocation()

  const requirements = location.state?.requirements || {}

  const [ownedFurniture, setOwnedFurniture] = useState([])
  const [plannedFurniture, setPlannedFurniture] = useState([])
  const [ownedAppliances, setOwnedAppliances] = useState([])
  const [plannedAppliances, setPlannedAppliances] = useState([])

  const [furnitureDetails, setFurnitureDetails] = useState({})
  const [customFurniture, setCustomFurniture] = useState("")

  const toggleFurniture = (value, currentValues, setValues) => {
    if (currentValues.includes(value)) {
      setValues(currentValues.filter((item) => item !== value))

      setFurnitureDetails((previous) => {
        const updated = { ...previous }
        delete updated[value]
        return updated
      })
    } else {
      setValues([...currentValues, value])

      setFurnitureDetails((previous) => ({
        ...previous,
        [value]: {
          quantity: "1",
          width: "",
          depth: "",
          height: "",
        },
      }))
    }
  }

  const toggleAppliance = (value, currentValues, setValues) => {
    if (currentValues.includes(value)) {
      setValues(currentValues.filter((item) => item !== value))
    } else {
      setValues([...currentValues, value])
    }
  }

  const updateFurnitureDetail = (item, field, value) => {
    setFurnitureDetails((previous) => ({
      ...previous,
      [item]: {
        ...previous[item],
        [field]: value,
      },
    }))
  }

  const handleContinue = () => {
    const furniture = {
      ownedFurniture,
      plannedFurniture,
      ownedAppliances,
      plannedAppliances,
      furnitureDetails,
      customFurniture,
    }

    const completeRequirements = {
      ...requirements,
      furniture,
    }

    console.log("MyNest Furniture:", furniture)
    console.log(
      "MyNest Complete Requirements:",
      completeRequirements
    )

    navigate("/analysis", {
      state: {
        requirements: completeRequirements,
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">

      {/* Header */}

      <header className="border-b border-[#E4E1D8] bg-[#F7F5EF]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-[#53604F] transition hover:text-[#202421]"
          >
            ← Back
          </button>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#71806B]">
              MyNest
            </p>

            <p className="mt-1 text-xs text-[#73766F]">
              Furniture & Appliances
            </p>
          </div>

          <div className="w-12" />

        </div>
      </header>

      {/* Progress */}

      <div className="border-b border-[#E4E1D8] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">

          <div className="flex items-center justify-between text-xs text-[#73766F]">
            <span>Step 3 of 4</span>
            <span>Furniture & Appliances</span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAE8E1]">
            <div className="h-full w-3/4 rounded-full bg-[#53604F]" />
          </div>

        </div>
      </div>

      {/* Main */}

      <main className="mx-auto max-w-5xl px-6 py-12">

        <div className="mb-12 max-w-3xl">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
            Design around what you own
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#202421] md:text-5xl">
            Tell MyNest about your furniture.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#73766F]">
            Your furniture and appliances take up real space. MyNest will
            consider them while planning rooms, circulation, storage and
            future furniture purchases.
          </p>

        </div>

        <div className="space-y-8">

          {/* Existing Furniture */}

          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">

            <SectionHeader
              number="01"
              title="What furniture do you already own?"
              description="Select the furniture you want MyNest to plan around."
            />

            <div className="grid gap-3 md:grid-cols-2">

              {furnitureOptions.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  selected={ownedFurniture.includes(option)}
                  onClick={() =>
                    toggleFurniture(
                      option,
                      ownedFurniture,
                      setOwnedFurniture
                    )
                  }
                />
              ))}

            </div>

          </section>

          {/* Existing Furniture Details */}

          {ownedFurniture.length > 0 && (
            <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">

              <SectionHeader
                number="02"
                title="Tell us their approximate sizes"
                description="Exact measurements are not required. Approximate dimensions help MyNest plan realistic circulation."
              />

              <div className="space-y-5">

                {ownedFurniture.map((item) => (

                  <div
                    key={item}
                    className="rounded-xl border border-[#E4E1D8] bg-[#FCFBF8] p-5"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div>
                        <p className="text-sm font-semibold text-[#202421]">
                          {item}
                        </p>

                        <p className="mt-1 text-xs text-[#73766F]">
                          Approximate dimensions in feet
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Width"
                          value={
                            furnitureDetails[item]?.width || ""
                          }
                          onChange={(event) =>
                            updateFurnitureDetail(
                              item,
                              "width",
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-[#E4E1D8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#71806B]"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Depth"
                          value={
                            furnitureDetails[item]?.depth || ""
                          }
                          onChange={(event) =>
                            updateFurnitureDetail(
                              item,
                              "depth",
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-[#E4E1D8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#71806B]"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Height"
                          value={
                            furnitureDetails[item]?.height || ""
                          }
                          onChange={(event) =>
                            updateFurnitureDetail(
                              item,
                              "height",
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-[#E4E1D8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#71806B]"
                        />

                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={
                            furnitureDetails[item]?.quantity || "1"
                          }
                          onChange={(event) =>
                            updateFurnitureDetail(
                              item,
                              "quantity",
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-[#E4E1D8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#71806B]"
                        />

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </section>
          )}

          {/* Planned Furniture */}

          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">

            <SectionHeader
              number="03"
              title="What furniture are you planning to buy?"
              description="MyNest can use these planned purchases when considering room sizes and furniture placement."
            />

            <div className="grid gap-3 md:grid-cols-2">

              {furnitureOptions.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  selected={plannedFurniture.includes(option)}
                  onClick={() =>
                    toggleFurniture(
                      option,
                      plannedFurniture,
                      setPlannedFurniture
                    )
                  }
                />
              ))}

            </div>

          </section>

          {/* Appliances */}

          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">

            <SectionHeader
              number="04"
              title="What appliances should MyNest consider?"
              description="Tell us about appliances you already own or plan to include."
            />

            <div className="grid gap-8 md:grid-cols-2">

              <div>

                <p className="mb-3 text-sm font-semibold text-[#202421]">
                  Already own
                </p>

                <div className="space-y-3">

                  {applianceOptions.map((option) => (
                    <OptionCard
                      key={option}
                      label={option}
                      selected={ownedAppliances.includes(option)}
                      onClick={() =>
                        toggleAppliance(
                          option,
                          ownedAppliances,
                          setOwnedAppliances
                        )
                      }
                    />
                  ))}

                </div>

              </div>

              <div>

                <p className="mb-3 text-sm font-semibold text-[#202421]">
                  Planning to buy
                </p>

                <div className="space-y-3">

                  {applianceOptions.map((option) => (
                    <OptionCard
                      key={option}
                      label={option}
                      selected={plannedAppliances.includes(option)}
                      onClick={() =>
                        toggleAppliance(
                          option,
                          plannedAppliances,
                          setPlannedAppliances
                        )
                      }
                    />
                  ))}

                </div>

              </div>

            </div>

          </section>

          {/* Custom Furniture */}

          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">

            <SectionHeader
              number="05"
              title="Anything else MyNest should know?"
              description="Mention furniture, appliances or special arrangements that are not listed above."
            />

            <textarea
              value={customFurniture}
              onChange={(event) =>
                setCustomFurniture(event.target.value)
              }
              placeholder="Example: I already have a 6 ft sofa, a king-size bed, a 5 ft wardrobe and a large refrigerator. I want space for a future study table."
              rows={6}
              className="w-full resize-none rounded-xl border border-[#E4E1D8] bg-[#FCFBF8] px-4 py-4 text-sm leading-6 text-[#202421] outline-none transition placeholder:text-[#9A9B95] focus:border-[#71806B]"
            />

          </section>

          {/* Summary */}

          <section className="rounded-2xl border border-[#D8DDD3] bg-[#EEF1EA] p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#53604F]">
              Furniture summary
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-4">

              <div>
                <p className="text-2xl font-semibold text-[#202421]">
                  {ownedFurniture.length}
                </p>

                <p className="text-xs text-[#73766F]">
                  Existing furniture
                </p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-[#202421]">
                  {plannedFurniture.length}
                </p>

                <p className="text-xs text-[#73766F]">
                  Planned furniture
                </p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-[#202421]">
                  {ownedAppliances.length}
                </p>

                <p className="text-xs text-[#73766F]">
                  Existing appliances
                </p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-[#202421]">
                  {plannedAppliances.length}
                </p>

                <p className="text-xs text-[#73766F]">
                  Planned appliances
                </p>
              </div>

            </div>

          </section>

          {/* Continue */}

          <div className="flex justify-end pb-8">

            <button
              type="button"
              onClick={handleContinue}
              className="rounded-xl bg-[#202421] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#53604F]"
            >
              Continue to AI Analysis →
            </button>

          </div>

        </div>

      </main>

    </div>
  )
}

export default FurniturePage