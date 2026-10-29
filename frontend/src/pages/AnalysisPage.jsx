import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

function AnalysisPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const requirements =
    location.state?.requirements || {
      plotWidth: "40",
      plotLength: "50",
      budget: "2500000",
      people: "4",
      bedrooms: "2",
      bathrooms: "2",
      planningType: "new",
    };

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    activeStep,
    setActiveStep,
  ] = useState(0);

  const [
    status,
    setStatus,
  ] = useState("analyzing");

  const [
    error,
    setError,
  ] = useState("");

  const analysisSteps = [
    "Reading your home requirements",
    "Understanding your preferences",
    "Analyzing room relationships",
    "Checking furniture and space needs",
    "Preparing your architectural planning brief",
  ];

  useEffect(() => {
    let cancelled = false;

    async function runAnalysis() {
      try {
        setStatus("analyzing");
        setError("");

        /*
         * Progress is visual only.
         * The actual completion depends on the AI response.
         */

        const progressTimer =
          setInterval(() => {
            if (cancelled) {
              clearInterval(
                progressTimer
              );

              return;
            }

            setProgress(
              (previous) => {
                if (
                  previous >= 90
                ) {
                  return previous;
                }

                return previous + 2;
              }
            );
          }, 100);

        /*
         * Move through the architectural-analysis stages
         * while the real backend request is running.
         */

        const stepTimer =
          setInterval(() => {
            if (cancelled) {
              clearInterval(
                stepTimer
              );

              return;
            }

            setActiveStep(
              (previous) => {
                if (
                  previous >=
                  analysisSteps.length - 1
                ) {
                  return previous;
                }

                return previous + 1;
              }
            );
          }, 900);

        try {
          /*
           * THIS IS THE IMPORTANT CHANGE.
           *
           * The complete requirements collected from
           * Planning + Preferences + Furniture are now
           * actually sent to the AI requirement analyzer.
           */

          const response =
            await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/planning/analyze-requirements`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  requirements,
                }),
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data?.error ||
                "AI requirement analysis failed."
            );
          }

          if (
            cancelled
          ) {
            return;
          }

          /*
           * AI analysis is now available.
           */

          setProgress(100);

          setActiveStep(
            analysisSteps.length - 1
          );

          setStatus("complete");

          /*
           * Give the completion state a moment to
           * appear before moving to the floor plan.
           */

          setTimeout(() => {
            if (
              cancelled
            ) {
              return;
            }

            navigate(
              "/floor-plan",
              {
                state: {
                  requirements,

                  aiAnalysis:
                    data.analysis,
                },
              }
            );
          }, 700);
        } finally {
          clearInterval(
            progressTimer
          );

          clearInterval(
            stepTimer
          );
        }
      } catch (requestError) {
        if (
          cancelled
        ) {
          return;
        }

        console.error(
          "MyNest AI analysis error:",
          requestError
        );

        setStatus("error");

        setError(
          requestError?.message ||
            "Unable to analyze your requirements."
        );
      }
    }

    runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">

      {/* Header */}
      <header className="border-b border-[#E4E1D8] bg-[#F7F5EF]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">

          {/* Logo */}
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

          {/* Step indicator */}
          <div className="hidden text-right sm:block">

            <p className="text-[10px] font-medium tracking-[0.18em] text-[#73766F]">
              STEP
            </p>

            <p className="mt-1 text-sm font-semibold text-[#53604F]">
              05 OF 07
            </p>

          </div>

        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex min-h-[calc(100vh-82px)] max-w-5xl items-center px-6 py-12 lg:px-10">

        <div className="w-full">

          {/* Top label */}
          <div className="mb-6 text-center">

            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B86F52]">
              AI REQUIREMENT ANALYSIS
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {status === "error"
                ? "We couldn't analyze your home requirements"
                : status === "complete"
                  ? "Your planning brief is ready"
                  : "Understanding your home"}
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#73766F]">
              {status === "error"
                ? "The planning engine could not receive the AI analysis. Check that your MyNest backend is running and try again."
                : status === "complete"
                  ? "Your requirements have been converted into a structured architectural planning brief."
                  : "MyNest is understanding how your space, lifestyle, priorities and requirements should influence the home plan."}
            </p>

          </div>

          {/* Analysis Card */}
          <section className="rounded-2xl border border-[#E4E1D8] bg-white p-6 shadow-[0_12px_40px_rgba(32,36,33,0.05)] sm:p-8">

            {/* Progress */}
            <div>

              <div className="mb-3 flex items-center justify-between">

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#73766F]">
                  Planning analysis
                </span>

                <span className="text-sm font-semibold text-[#53604F]">
                  {progress}%
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#ECEAE2]">

                <div
                  className="h-full rounded-full bg-[#53604F] transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

            </div>

            {/* Steps */}
            <div className="mt-8 space-y-4">

              {analysisSteps.map(
                (
                  step,
                  index
                ) => {

                  const completed =
                    status === "complete" ||
                    index < activeStep;

                  const active =
                    status === "analyzing" &&
                    index === activeStep;

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-4 rounded-xl border px-4 py-4 transition-all ${
                        active
                          ? "border-[#71806B] bg-[#F7F5EF]"
                          : completed
                            ? "border-[#E4E1D8] bg-white"
                            : "border-[#E4E1D8] bg-white"
                      }`}
                    >

                      {/* Status circle */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                          completed
                            ? "border-[#53604F] bg-[#53604F] text-white"
                            : active
                              ? "border-[#71806B] text-[#53604F]"
                              : "border-[#D8D5CB] text-[#9A9A91]"
                        }`}
                      >
                        {completed
                          ? "✓"
                          : String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                      </div>

                      {/* Text */}
                      <div>

                        <p
                          className={`text-sm font-medium ${
                            active ||
                            completed
                              ? "text-[#202421]"
                              : "text-[#9A9A91]"
                          }`}
                        >
                          {step}
                        </p>

                        {active && (
                          <p className="mt-1 text-xs text-[#73766F]">
                            AI is processing this requirement layer.
                          </p>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

            {/* Error */}
            {status === "error" && (
              <div className="mt-6 rounded-xl border border-[#E5C7BA] bg-[#FBF2EE] p-5">

                <p className="text-sm font-semibold text-[#8E5039]">
                  Analysis failed
                </p>

                <p className="mt-2 text-sm leading-6 text-[#73766F]">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="mt-4 rounded-lg bg-[#53604F] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#465143]"
                >
                  Try again
                </button>

              </div>
            )}

            {/* Complete */}
            {status === "complete" && (
              <div className="mt-6 rounded-xl border border-[#DCE3D8] bg-[#F4F7F2] p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#53604F] text-sm text-white">
                    ✓
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-[#202421]">
                      Architectural brief prepared
                    </p>

                    <p className="mt-1 text-xs text-[#73766F]">
                      Moving to personalized concept generation.
                    </p>

                  </div>

                </div>

              </div>
            )}

          </section>

          {/* Footer note */}
          <div className="mt-6 text-center">

            <p className="text-[10px] uppercase tracking-[0.16em] text-[#9A9A91]">
              MyNest — Where every square feet matters.
            </p>

            <p className="mt-2 text-[11px] text-[#9A9A91]">
              Conceptual planning assistance / not for construction
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}

export default AnalysisPage;