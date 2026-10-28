import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const relationshipOptions = [
  "Kitchen ↔ Dining",
  "Kitchen ↔ Utility",
  "Kitchen ↔ Store / Pantry",
  "Living ↔ Entrance",
  "Master Bedroom ↔ Attached Bathroom",
  "Bedrooms ↔ Common Bathroom",
  "Dining ↔ Living",
  "Study ↔ Bedroom",
]

const separationOptions = [
  "Bedroom away from Living",
  "Kitchen away from Entrance",
  "Bedrooms away from Noisy Areas",
  "Private Spaces away from Guest Areas",
]

const priorityOptions = [
  "Spacious Living Room",
  "Spacious Master Bedroom",
  "Larger Kitchen",
  "More Storage",
  "Larger Bathrooms",
  "More Bedrooms",
  "Study / Workspace",
  "Outdoor Space",
  "More Circulation Space",
  "Guest-Friendly Spaces",
]

const specialOptions = [
  "Pooja Room",
  "Study Room",
  "Home Office",
  "Pantry / Store Room",
  "Utility Area",
  "Guest Room",
  "Balcony",
  "Parking",
  "Laundry Area",
  "Garden / Greenery",
  "Children's Play Area",
  "Elder-Friendly Space",
  "Future Expansion Space",
]

const lifestyleOptions = [
  "Work / Study From Home",
  "Frequently Have Guests",
  "Cook Frequently",
  "Need Quiet / Private Spaces",
  "Need Entertainment Area",
]

const comfortOptions = [
  "Maximum Natural Light",
  "Strong Cross Ventilation",
  "High Privacy",
  "Open Spaces",
  "More Storage",
  "Outdoor Connection",
]

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
          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>

        <span className="text-sm font-medium">{label}</span>
      </div>
    </button>
  )
}

function SectionHeader({ number, title, description }) {
  return (
    <div className="mb-6 flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#202421] text-sm font-semibold text-white">
        {number}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#202421]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#73766F]">
          {description}
        </p>
      </div>
    </div>
  )
}

function PreferencesPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const requirements = location.state?.requirements || {}

  const [relationships, setRelationships] = useState([])
  const [separations, setSeparations] = useState([])
  const [priorities, setPriorities] = useState([])
  const [specialRequirements, setSpecialRequirements] = useState([])
  const [lifestyle, setLifestyle] = useState([])
  const [comfort, setComfort] = useState([])
  const [highestPriority, setHighestPriority] = useState("")
  const [customRequirements, setCustomRequirements] = useState("")

  const toggleOption = (value, currentValues, setValues) => {
    if (currentValues.includes(value)) {
      setValues(currentValues.filter((item) => item !== value))
    } else {
      setValues([...currentValues, value])
    }
  }

  const handleContinue = () => {
    const preferences = {
      relationships,
      separations,
      priorities,
      highestPriority,
      specialRequirements,
      lifestyle,
      comfort,
      customRequirements,
    }

    const completeRequirements = {
      ...requirements,
      preferences,
    }

    console.log("MyNest Preferences:", preferences)

    navigate("/furniture", {
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
              Preferences & Lifestyle
            </p>
          </div>

          <div className="w-12" />
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-[#E4E1D8] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between text-xs text-[#73766F]">
            <span>Step 2 of 4</span>
            <span>Preferences</span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAE8E1]">
            <div className="h-full w-1/2 rounded-full bg-[#53604F]" />
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
            Personalize your home
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#202421] md:text-5xl">
            Tell MyNest how you want your home to work.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#73766F]">
            Your preferences will become planning constraints that MyNest can
            consider when creating and comparing your home concepts.
          </p>
        </div>

        <div className="space-y-8">
          {/* Room relationships */}
          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">
            <SectionHeader
              number="01"
              title="How should your spaces connect?"
              description="Choose spaces you would like to keep close to each other."
            />

            <div className="grid gap-3 md:grid-cols-2">
              {relationshipOptions.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  selected={relationships.includes(option)}
                  onClick={() =>
                    toggleOption(option, relationships, setRelationships)
                  }
                />
              ))}
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-[#202421]">
                Are there spaces you want separated?
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {separationOptions.map((option) => (
                  <OptionCard
                    key={option}
                    label={option}
                    selected={separations.includes(option)}
                    onClick={() =>
                      toggleOption(option, separations, setSeparations)
                    }
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Priorities */}
          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">
            <SectionHeader
              number="02"
              title="What matters most to you?"
              description="Select the spaces and qualities you want MyNest to prioritize."
            />

            <div className="grid gap-3 md:grid-cols-2">
              {priorityOptions.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  selected={priorities.includes(option)}
                  onClick={() =>
                    toggleOption(option, priorities, setPriorities)
                  }
                />
              ))}
            </div>

            <div className="mt-8 max-w-xl">
              <label
                htmlFor="highestPriority"
                className="mb-2 block text-sm font-semibold text-[#202421]"
              >
                Which space should receive the highest priority?
              </label>

              <select
                id="highestPriority"
                value={highestPriority}
                onChange={(event) => setHighestPriority(event.target.value)}
                className="w-full rounded-xl border border-[#E4E1D8] bg-white px-4 py-3 text-sm text-[#202421] outline-none transition focus:border-[#71806B]"
              >
                <option value="">Select a priority</option>
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Special requirements */}
          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">
            <SectionHeader
              number="03"
              title="What else does your home need?"
              description="Select any special spaces or facilities that matter to your household."
            />

            <div className="grid gap-3 md:grid-cols-2">
              {specialOptions.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  selected={specialRequirements.includes(option)}
                  onClick={() =>
                    toggleOption(
                      option,
                      specialRequirements,
                      setSpecialRequirements
                    )
                  }
                />
              ))}
            </div>
          </section>

          {/* Lifestyle */}
          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">
            <SectionHeader
              number="04"
              title="How do you live in your home?"
              description="Your lifestyle helps MyNest understand how spaces should function."
            />

            <p className="mb-3 text-sm font-semibold text-[#202421]">
              Lifestyle
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {lifestyleOptions.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  selected={lifestyle.includes(option)}
                  onClick={() =>
                    toggleOption(option, lifestyle, setLifestyle)
                  }
                />
              ))}
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-[#202421]">
                Comfort & environment
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {comfortOptions.map((option) => (
                  <OptionCard
                    key={option}
                    label={option}
                    selected={comfort.includes(option)}
                    onClick={() =>
                      toggleOption(option, comfort, setComfort)
                    }
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Custom requirements */}
          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-7 shadow-[0_12px_35px_rgba(32,36,33,0.04)]">
            <SectionHeader
              number="05"
              title="Tell MyNest anything else"
              description="Describe your ideal home in your own words. MyNest will eventually translate these preferences into planning constraints."
            />

            <textarea
              value={customRequirements}
              onChange={(event) => setCustomRequirements(event.target.value)}
              placeholder="Example: I want my kitchen next to the dining area, a spacious master bedroom, a small store room inside the kitchen, and good morning sunlight in the bedrooms."
              rows={6}
              className="w-full resize-none rounded-xl border border-[#E4E1D8] bg-[#FCFBF8] px-4 py-4 text-sm leading-6 text-[#202421] outline-none transition placeholder:text-[#9A9B95] focus:border-[#71806B]"
            />
          </section>

          {/* Summary */}
          <section className="rounded-2xl border border-[#D8DDD3] bg-[#EEF1EA] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#53604F]">
              Preference summary
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-[#202421]">
                  {relationships.length + separations.length}
                </p>
                <p className="text-xs text-[#73766F]">
                  Spatial relationships
                </p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-[#202421]">
                  {priorities.length}
                </p>
                <p className="text-xs text-[#73766F]">Priority spaces</p>
              </div>

              <div>
                <p className="text-2xl font-semibold text-[#202421]">
                  {specialRequirements.length}
                </p>
                <p className="text-xs text-[#73766F]">
                  Special requirements
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
              Continue to Furniture & Appliances →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PreferencesPage