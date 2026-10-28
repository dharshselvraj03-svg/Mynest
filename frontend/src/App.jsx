import {

  BrowserRouter,

  Navigate,

  Route,

  Routes,

  Link,

} from "react-router-dom";



import LoginPage from "./pages/LoginPage";

import RegisterPage from "./pages/RegisterPage";

import PlanningPage from "./pages/PlanningPage";

import PreferencesPage from "./pages/PreferencesPage";

import FurniturePage from "./pages/FurniturePage";

import AnalysisPage from "./pages/AnalysisPage";

import FloorPlanPage from "./pages/FloorPlanPage";

import ConceptComparisonPage from "./pages/ConceptComparisonPage";

import CustomizePlanPage from "./pages/CustomizePlanPage";
import FinalHomeVisualizationPage from "./pages/FinalHomeVisualizationPage";





function MyNestLogo() {

  return (

    <div className="flex items-center gap-3">

      <svg

        width="44"

        height="44"

        viewBox="0 0 44 44"

        fill="none"

        xmlns="http\://www\.w3.org/2000/svg"

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





function HomePage() {

  return (

    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">



      <header className="relative z-30 border-b border-[#E4E1D8] bg-[#F7F5EF]/95 backdrop-blur-sm">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">



          <MyNestLogo />



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

              href="#about"

              className="transition hover:text-[#202421]"

            >

              About

            </a>

          </nav>



          <Link

            to="/login"

            className="rounded-full bg-[#202421] px-6 py-3 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#53604F]"

          >

            Start Planning

          </Link>



        </div>

      </header>



      <main className="relative overflow-hidden">



        <div

          className="pointer-events-none absolute inset-0 opacity-[0.18]"

          style={{

            backgroundImage:

              "linear-gradient(#C8C5BA 1px, transparent 1px), linear-gradient(90deg, #C8C5BA 1px, transparent 1px)",

            backgroundSize: "80px 80px",

          }}

        />



        <div

          className="pointer-events-none absolute inset-0 opacity-[0.07]"

          style={{

            backgroundImage:

              "linear-gradient(#C8C5BA 1px, transparent 1px), linear-gradient(90deg, #C8C5BA 1px, transparent 1px)",

            backgroundSize: "20px 20px",

          }}

        />



        <div className="pointer-events-none absolute -left-64 top-28 h-[600px] w-[600px] rounded-full border border-[#71806B]/10" />



        <div className="pointer-events-none absolute -left-32 top-52 h-[400px] w-[400px] rounded-full border border-[#71806B]/10" />



        <div className="pointer-events-none absolute -right-72 -top-48 h-[700px] w-[700px] rounded-full border border-[#B86F52]/[0.07]" />



        <div className="pointer-events-none absolute left-0 top-[35%] h-px w-[25%] bg-[#202421]/[0.05]" />



        <div className="pointer-events-none absolute left-[12%] top-0 h-full w-px bg-[#202421]/[0.035]" />



        <section className="relative z-10 mx-auto grid min-h-[calc(100vh-86px)] max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">



          <div className="max-w-xl">



            <div className="mb-6 flex items-center gap-3">

              <span className="h-px w-8 bg-[#71806B]" />



              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71806B]">

                Intelligent Home Planning

              </p>

            </div>



            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-[#202421] sm:text-6xl lg:text-[4.4rem]">

              Design the home

              <br />

              <span className="text-[#53604F]">

                around your life.

              </span>

            </h1>



            <p className="mt-7 max-w-lg text-[17px] leading-8 text-[#73766F]">

              MyNest helps you plan and optimize your home based on your

              space, budget, lifestyle, furniture, and future needs.

            </p>



            <p className="mt-5 text-sm font-medium italic tracking-wide text-[#53604F]">

              Where every square feet matters.

            </p>



            <div className="mt-9 flex flex-wrap items-center gap-4">



              <Link

                to="/login"

                className="rounded-full bg-[#202421] px-7 py-3.5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#53604F]"

              >

                Start Planning

              </Link>



              <button

                type="button"

                className="rounded-full border border-[#D6D3C9] bg-white/80 px-7 py-3.5 text-sm font-medium text-[#202421] backdrop-blur-sm transition duration-200 hover:bg-white"

              >

                Explore Features

              </button>



            </div>



            <div className="mt-11 flex flex-wrap items-center gap-x-5 gap-y-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#73766F]">



              <span>Plot-aware</span>

              <span className="text-[#C8C5BA]">•</span>

              <span>Budget-aware</span>

              <span className="text-[#C8C5BA]">•</span>

              <span>Furniture-aware</span>

              <span className="text-[#C8C5BA]">•</span>

              <span>Sustainability-ready</span>



            </div>



            <div className="mt-12 border-l-2 border-[#71806B] pl-4">



              <p className="text-xs leading-5 text-[#73766F]">

                One planning system for your{" "}

                <span className="font-medium text-[#202421]">

                  space, budget and lifestyle.

                </span>

              </p>



            </div>



          </div>



          <div className="relative">



            <div className="absolute -right-1 -top-7 hidden items-center gap-2 lg:flex">



              <span className="h-px w-8 bg-[#C8C5BA]" />



              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#73766F]">

                Spatial planning / 01

              </span>



            </div>



            <div className="overflow-visible rounded-[2rem] border border-[#E4E1D8] bg-white/95 shadow-[0_20px_60px_rgba(32,36,33,0.06)] backdrop-blur-sm">



              <div className="flex items-center justify-between border-b border-[#E4E1D8] px-6 py-4">



                <div>

                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#71806B]">

                    MyNest / Concept Plan

                  </p>



                  <p className="mt-1 text-sm font-medium text-[#202421]">

                    Personalized layout

                  </p>

                </div>



                <div className="flex items-center gap-2">



                  <span className="h-1.5 w-1.5 rounded-full bg-[#71806B]" />



                  <span className="text-[10px] font-medium text-[#53604F]">

                    AI Preview

                  </span>



                </div>



              </div>



              <div className="p-6">



                <div className="relative overflow-visible rounded-xl bg-[#F7F5EF] p-6">



                  <div

                    className="absolute inset-0 rounded-xl opacity-40"

                    style={{

                      backgroundImage:

                        "linear-gradient(#D9D6CC 1px, transparent 1px), linear-gradient(90deg, #D9D6CC 1px, transparent 1px)",

                      backgroundSize: "22px 22px",

                    }}

                  />



                  <div className="absolute right-4 top-4 z-20 flex flex-col items-center">



                    <span className="text-[8px] font-bold text-[#202421]">

                      N

                    </span>



                    <div className="h-5 w-px bg-[#202421]" />



                    <div className="h-0 w-0 border-x-[3px] border-b-[6px] border-x-transparent border-b-[#202421]" />



                  </div>



                  <div className="relative mx-auto aspect-[1.12] w-full max-w-[480px] border-[3px] border-[#202421] bg-white">



                    <div className="absolute left-0 top-0 h-[55%] w-[57%] border-b-[2px] border-r-[2px] border-[#202421]">



                      <div className="absolute inset-0 flex flex-col items-center justify-center">



                        <div className="relative mb-3 h-10 w-24 rounded-md border border-[#71806B] bg-[#71806B]/10">

                          <div className="absolute -left-1 top-2 h-6 w-2 rounded-sm border border-[#71806B] bg-white" />

                          <div className="absolute -right-1 top-2 h-6 w-2 rounded-sm border border-[#71806B] bg-white" />

                        </div>



                        <div className="h-5 w-12 rounded-full border border-[#D6D3C9] bg-[#F7F5EF]" />



                        <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.15em]">

                          Living

                        </p>



                        <p className="mt-1 text-[8px] text-[#73766F]">

                          12 × 14 ft

                        </p>



                      </div>

                    </div>



                    <div className="absolute right-0 top-0 h-[55%] w-[43%] border-b-[2px] border-[#202421]">



                      <div className="absolute inset-0 flex flex-col items-center justify-center">



                        <div className="relative mb-3 h-14 w-20 rounded border border-[#B86F52] bg-[#B86F52]/10">



                          <div className="absolute left-2 right-2 top-2 h-3 rounded border border-[#B86F52]/50 bg-white" />



                          <div className="absolute bottom-2 left-2 right-2 h-px bg-[#B86F52]/40" />



                        </div>



                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">

                          Bedroom

                        </p>



                        <p className="mt-1 text-[8px] text-[#73766F]">

                          10 × 12 ft

                        </p>



                      </div>



                    </div>



                    <div className="absolute bottom-0 left-0 h-[45%] w-[34%] border-r-[2px] border-[#202421]">



                      <div className="absolute inset-0 flex flex-col items-center justify-center">



                        <div className="mb-3 grid h-9 w-20 grid-cols-4 overflow-hidden rounded border border-[#71806B] bg-[#71806B]/10">



                          <span className="border-r border-[#71806B]/30" />

                          <span className="border-r border-[#71806B]/30" />

                          <span className="border-r border-[#71806B]/30" />

                          <span />



                        </div>



                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">

                          Kitchen

                        </p>



                        <p className="mt-1 text-[8px] text-[#73766F]">

                          8 × 10 ft

                        </p>



                      </div>



                    </div>



                    <div className="absolute bottom-0 left-[34%] h-[45%] w-[39%] border-r-[2px] border-[#202421]">



                      <div className="absolute inset-0 flex flex-col items-center justify-center">



                        <div className="relative mb-3 h-8 w-20 rounded-full border border-[#D6D3C9] bg-[#F7F5EF]">



                          <span className="absolute -left-3 top-2 h-4 w-2 rounded-sm border border-[#D6D3C9]" />

                          <span className="absolute -right-3 top-2 h-4 w-2 rounded-sm border border-[#D6D3C9]" />

                          <span className="absolute left-8 -top-3 h-2 w-4 rounded-sm border border-[#D6D3C9]" />

                          <span className="absolute left-8 -bottom-3 h-2 w-4 rounded-sm border border-[#D6D3C9]" />



                        </div>



                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">

                          Dining

                        </p>



                        <p className="mt-1 text-[8px] text-[#73766F]">

                          8 × 10 ft

                        </p>



                      </div>



                    </div>



                    <div className="absolute bottom-0 right-0 h-[45%] w-[27%]">



                      <div className="absolute inset-0 flex flex-col items-center justify-center">



                        <div className="mb-2 h-4 w-8 rounded-full border border-[#71806B]" />



                        <div className="mb-3 h-7 w-5 rounded-full border border-[#D6D3C9]" />



                        <p className="text-[8px] font-semibold uppercase tracking-[0.12em]">

                          Bath

                        </p>



                        <p className="mt-1 text-[7px] text-[#73766F]">

                          5 × 7 ft

                        </p>



                      </div>



                    </div>



                  </div>



                </div>



                <div className="mt-5 grid grid-cols-3 divide-x divide-[#E4E1D8] rounded-xl border border-[#E4E1D8] bg-[#F7F5EF] py-4">



                  <div className="px-4 text-center">

                    <p className="text-[11px] text-[#73766F]">

                      Plot

                    </p>



                    <p className="mt-1 text-sm font-semibold">

                      30 × 50 ft

                    </p>

                  </div>



                  <div className="px-4 text-center">

                    <p className="text-[11px] text-[#73766F]">

                      Rooms

                    </p>



                    <p className="mt-1 text-sm font-semibold">

                      2 BHK

                    </p>

                  </div>



                  <div className="px-4 text-center">

                    <p className="text-[11px] text-[#73766F]">

                      Planning

                    </p>



                    <p className="mt-1 text-sm font-semibold text-[#53604F]">

                      Optimized

                    </p>

                  </div>



                </div>



                <div className="mt-4 flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-[#9A9A91]">



                  <span>

                    Conceptual / Not for construction

                  </span>



                  <span>

                    MN — 01

                  </span>



                </div>



              </div>



            </div>



          </div>



        </section>



      </main>



    </div>

  );

}





/* =========================================================

   PROTECTED ROUTE

\========================================================= */



function ProtectedRoute({ children }) {

  const authenticated =

    sessionStorage.getItem("mynest_authenticated") === "true";



  if (!authenticated) {

    return <Navigate to="/login" replace />;

  }



  return children;

}





/* =========================================================

   APP ROUTING

\========================================================= */



export default function App() {

  return (

    <BrowserRouter>



      <Routes>



        {/* =================================================

            PUBLIC HOMEPAGE

        ================================================= */}



        <Route

          path="/"

          element={<HomePage />}

        />





        {/* =================================================

            LOGIN

        ================================================= */}



        <Route

          path="/login"

          element={<LoginPage />}

        />





        {/* =================================================

            REGISTER

        ================================================= */}



        <Route

          path="/register"

          element={<RegisterPage />}

        />





        {/* =================================================

            EXISTING MYNEST FLOW — UNCHANGED

        ================================================= */}



        <Route

          path="/planning"

          element={

            <ProtectedRoute>

              <PlanningPage />

            </ProtectedRoute>

          }

        />



        <Route

          path="/preferences"

          element={

            <ProtectedRoute>

              <PreferencesPage />

            </ProtectedRoute>

          }

        />



        <Route

          path="/furniture"

          element={

            <ProtectedRoute>

              <FurniturePage />

            </ProtectedRoute>

          }

        />



        <Route

          path="/analysis"

          element={

            <ProtectedRoute>

              <AnalysisPage />

            </ProtectedRoute>

          }

        />



        <Route

          path="/floor-plan"

          element={

            <ProtectedRoute>

              <FloorPlanPage />

            </ProtectedRoute>

          }

        />





        {/* =================================================

            LATER STAGES — UNCHANGED

        ================================================= */}



        <Route

          path="/concept-comparison"

          element={

            <ProtectedRoute>

              <ConceptComparisonPage />

            </ProtectedRoute>

          }

        />



        <Route

          path="/customize-plan"

          element={

            <ProtectedRoute>

              <CustomizePlanPage />

            </ProtectedRoute>

          }

        />

        <Route
          path="/final-home"
          element={
            <ProtectedRoute>
              <FinalHomeVisualizationPage />
            </ProtectedRoute>
          }
        />





        {/* =================================================

            FALLBACK

        ================================================= */}



        <Route

          path="*"

          element={<Navigate to="/" replace />}

        />



      </Routes>



    </BrowserRouter>

  );

}