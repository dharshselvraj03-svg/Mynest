import { useState } from "react"
import { useNavigate } from "react-router-dom"

function PlanningPage() {
  const navigate = useNavigate()

  const [planningType, setPlanningType] = useState("new")

  const [formData, setFormData] = useState({
    plotWidth: "",
    plotLength: "",
    budget: "",
    people: "",
    bedrooms: "2",
    bathrooms: "2",
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))

    setSubmitted(false)
  }

  const handleContinue = () => {
    if (
      !formData.plotWidth ||
      !formData.plotLength ||
      !formData.budget ||
      !formData.people
    ) {
      setSubmitted(false)
      return
    }

    const requirements = {
      planningType,
      ...formData,
    }

    console.log("MyNest Requirements:", requirements)

    setSubmitted(true)

    setTimeout(() => {
      navigate("/preferences", {
        state: {
          requirements,
        },
      })
    }, 500)
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">

      {/* Header */}
      <header className="border-b border-[#E4E1D8] bg-[#F7F5EF]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#71806B] bg-white">
              <div className="relative h-6 w-6">

                <div className="absolute left-1 top-2 h-4 w-4 border-2 border-[#71806B]" />

                <div className="absolute left-1.5 top-0.5 h-3 w-3 rotate-45 border-l-2 border-t-2 border-[#71806B]" />

                <div className="absolute left-2.5 top-3 h-3 w-2 border border-[#B86F52]" />

              </div>
            </div>

            <div>
              <div className="text-lg font-semibold tracking-[0.25em]">
                MYNEST
              </div>

              <div className="text-[8px] font-medium tracking-[0.3em] text-[#73766F]">
                SMART HOME PLANNING
              </div>
            </div>

          </div>

          <div className="hidden text-right sm:block">

            <p className="text-[10px] font-medium tracking-[0.25em] text-[#71806B]">
              HOME PLANNING / 01
            </p>

            <p className="mt-1 text-xs text-[#73766F]">
              Tell us about your home
            </p>

          </div>

        </div>
      </header>


      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-16">

        {/* Intro */}
        <section className="mb-10 max-w-2xl">

          <p className="mb-4 text-xs font-medium tracking-[0.25em] text-[#71806B]">
            START PLANNING
          </p>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Let's understand

            <span className="block text-[#53604F]">
              your space.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-[#73766F]">
            Give us a few details about your home, budget and family.
            MyNest will use these requirements to create a personalized
            planning direction for you.
          </p>

        </section>


        {/* Main Card */}
        <section className="rounded-2xl border border-[#E4E1D8] bg-white p-6 shadow-[0_10px_35px_rgba(32,36,33,0.04)] sm:p-8">

          {/* Project Type */}
          <div className="mb-8">

            <p className="text-xs font-medium tracking-[0.2em] text-[#71806B]">
              01 / PROJECT TYPE
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              What are you planning?
            </h2>

            <p className="mt-2 text-sm text-[#73766F]">
              Choose the type of home planning you need.
            </p>

          </div>


          <div className="grid gap-4 md:grid-cols-2">

            {/* Build New */}
            <button
              type="button"
              onClick={() => setPlanningType("new")}
              className={`rounded-xl border-2 p-6 text-left transition ${
                planningType === "new"
                  ? "border-[#71806B] bg-[#F7F5EF]"
                  : "border-[#E4E1D8] bg-white hover:border-[#71806B]"
              }`}
            >

              <div className="flex items-start justify-between">

                <div>

                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-[#D9D6CC] bg-white">
                    <div className="h-5 w-5 border-2 border-[#53604F]" />
                  </div>

                  <h3 className="text-lg font-semibold">
                    Build a new home
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#73766F]">
                    Plan a new house based on your plot, family,
                    lifestyle and budget.
                  </p>

                </div>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    planningType === "new"
                      ? "border-[#71806B]"
                      : "border-[#C9C7BF]"
                  }`}
                >

                  {planningType === "new" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[#71806B]" />
                  )}

                </div>

              </div>

            </button>


            {/* Existing Home */}
            <button
              type="button"
              onClick={() => setPlanningType("existing")}
              className={`rounded-xl border-2 p-6 text-left transition ${
                planningType === "existing"
                  ? "border-[#71806B] bg-[#F7F5EF]"
                  : "border-[#E4E1D8] bg-white hover:border-[#71806B]"
              }`}
            >

              <div className="flex items-start justify-between">

                <div>

                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-[#E4E1D8] bg-[#F7F5EF]">

                    <div className="h-5 w-5 border border-[#53604F]">
                      <div className="ml-1 mt-1 h-2 w-2 border border-[#B86F52]" />
                    </div>

                  </div>

                  <h3 className="text-lg font-semibold">
                    Optimize an existing home
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#73766F]">
                    Improve your current space using your existing
                    rooms, furniture and requirements.
                  </p>

                </div>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    planningType === "existing"
                      ? "border-[#71806B]"
                      : "border-[#C9C7BF]"
                  }`}
                >

                  {planningType === "existing" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[#71806B]" />
                  )}

                </div>

              </div>

            </button>

          </div>


          {/* Basic Requirements */}
          <div className="mt-12 border-t border-[#E4E1D8] pt-10">

            <div className="mb-8">

              <p className="text-xs font-medium tracking-[0.2em] text-[#71806B]">
                02 / BASIC REQUIREMENTS
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Tell us about your home
              </h2>

              <p className="mt-2 text-sm text-[#73766F]">
                These details help MyNest understand your basic planning constraints.
              </p>

            </div>


            <div className="grid gap-6 sm:grid-cols-2">

              {/* Plot Width */}
              <div>

                <label className="mb-2 block text-sm font-medium">
                  Plot width
                </label>

                <div className="flex overflow-hidden rounded-lg border border-[#E4E1D8] bg-white focus-within:border-[#71806B]">

                  <input
                    type="number"
                    value={formData.plotWidth}
                    onChange={(event) =>
                      handleChange("plotWidth", event.target.value)
                    }
                    placeholder="30"
                    min="1"
                    className="w-full bg-transparent px-4 py-3 text-sm outline-none"
                  />

                  <span className="flex items-center border-l border-[#E4E1D8] px-4 text-sm text-[#73766F]">
                    ft
                  </span>

                </div>

              </div>


              {/* Plot Length */}
              <div>

                <label className="mb-2 block text-sm font-medium">
                  Plot length
                </label>

                <div className="flex overflow-hidden rounded-lg border border-[#E4E1D8] bg-white focus-within:border-[#71806B]">

                  <input
                    type="number"
                    value={formData.plotLength}
                    onChange={(event) =>
                      handleChange("plotLength", event.target.value)
                    }
                    placeholder="50"
                    min="1"
                    className="w-full bg-transparent px-4 py-3 text-sm outline-none"
                  />

                  <span className="flex items-center border-l border-[#E4E1D8] px-4 text-sm text-[#73766F]">
                    ft
                  </span>

                </div>

              </div>


              {/* Budget */}
              <div>

                <label className="mb-2 block text-sm font-medium">
                  Approximate budget
                </label>

                <div className="flex overflow-hidden rounded-lg border border-[#E4E1D8] bg-white focus-within:border-[#71806B]">

                  <span className="flex items-center border-r border-[#E4E1D8] px-4 text-sm text-[#73766F]">
                    ₹
                  </span>

                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(event) =>
                      handleChange("budget", event.target.value)
                    }
                    placeholder="2500000"
                    min="0"
                    className="w-full bg-transparent px-4 py-3 text-sm outline-none"
                  />

                </div>

              </div>


              {/* People */}
              <div>

                <label className="mb-2 block text-sm font-medium">
                  Number of people
                </label>

                <input
                  type="number"
                  value={formData.people}
                  onChange={(event) =>
                    handleChange("people", event.target.value)
                  }
                  placeholder="4"
                  min="1"
                  className="w-full rounded-lg border border-[#E4E1D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#71806B]"
                />

              </div>


              {/* Bedrooms */}
              <div>

                <label className="mb-2 block text-sm font-medium">
                  Bedrooms required
                </label>

                <select
                  value={formData.bedrooms}
                  onChange={(event) =>
                    handleChange("bedrooms", event.target.value)
                  }
                  className="w-full rounded-lg border border-[#E4E1D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#71806B]"
                >
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5+ Bedrooms</option>
                </select>

              </div>


              {/* Bathrooms */}
              <div>

                <label className="mb-2 block text-sm font-medium">
                  Bathrooms required
                </label>

                <select
                  value={formData.bathrooms}
                  onChange={(event) =>
                    handleChange("bathrooms", event.target.value)
                  }
                  className="w-full rounded-lg border border-[#E4E1D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#71806B]"
                >
                  <option value="1">1 Bathroom</option>
                  <option value="2">2 Bathrooms</option>
                  <option value="3">3 Bathrooms</option>
                  <option value="4">4 Bathrooms</option>
                  <option value="5">5+ Bathrooms</option>
                </select>

              </div>

            </div>

          </div>


          {/* Continue Area */}
          <div className="mt-10 border-t border-[#E4E1D8] pt-8">

            {submitted && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#71806B]/30 bg-[#71806B]/10 px-5 py-4">

                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#71806B] text-xs font-bold text-white">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#53604F]">
                    Requirements captured
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#73766F]">
                    Moving to your personalized preferences.
                  </p>
                </div>

              </div>
            )}


            <div className="flex justify-end">

              <button
                type="button"
                onClick={handleContinue}
                className="rounded-full bg-[#202421] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#53604F]"
              >
                Continue to Preferences →
              </button>

            </div>

          </div>

        </section>


        {/* Bottom Note */}
        <div className="mt-6 flex items-center justify-between text-xs text-[#73766F]">

          <span>
            MyNest / Planning workflow
          </span>

          <span>
            01 of 07
          </span>

        </div>

      </main>

    </div>
  )
}

export default PlanningPage