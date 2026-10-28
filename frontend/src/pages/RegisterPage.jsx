import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function MyNestLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="14"
          fill="#F7F5EF"
          stroke="#71806B"
          strokeWidth="1.5"
        />

        <path
          d="M12 31V19L24 10L36 19V31"
          stroke="#202421"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M16 31V21L24 15L32 21V31"
          stroke="#71806B"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M18 29V22L30 29V21"
          stroke="#B86F52"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M12 31H36"
          stroke="#202421"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <div>
        <div className="text-[22px] font-semibold tracking-[0.18em] text-[#202421]">
          MYNEST
        </div>

        <div className="mt-1 text-[8px] font-medium tracking-[0.24em] text-[#73766F]">
          INTELLIGENT HOME PLANNING
        </div>
      </div>
    </div>
  );
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);

  const hashBuffer = await window.crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const existingAccount = localStorage.getItem("mynest_account");

    if (existingAccount) {
      try {
        const account = JSON.parse(existingAccount);

        if (account.email === email) {
          setError(
            "An account with this email already exists. Please sign in."
          );
          return;
        }
      } catch {
        localStorage.removeItem("mynest_account");
      }
    }

    const passwordHash = await hashPassword(password);

    const account = {
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "mynest_account",
      JSON.stringify(account)
    );

    setSuccess(true);

    setTimeout(() => {
      navigate("/", {
        replace: true,
        state: {
          registered: true,
          email,
        },
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#202421]">

      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        <section className="relative hidden overflow-hidden bg-[#202421] lg:flex">

          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(#FFFFFF 1px, transparent 1px), linear-gradient(90deg, #FFFFFF 1px, transparent 1px)",
              backgroundSize: "70px 70px",
            }}
          />

          <div className="absolute -left-40 top-20 h-[520px] w-[520px] rounded-full border border-[#B9C4B1]/20" />

          <div className="absolute -right-56 bottom-[-120px] h-[600px] w-[600px] rounded-full border border-[#B86F52]/15" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            <MyNestLogo />

            <div className="max-w-xl">

              <p className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B9C4B1]">
                <span className="h-px w-8 bg-[#71806B]" />
                Your MyNest journey
              </p>

              <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.035em] text-white xl:text-6xl">
                Your home.
                <br />
                <span className="text-[#B9C4B1]">
                  Your way.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-[16px] leading-8 text-[#C8CDC5]">
                Create your MyNest account and keep your personalized
                home-planning journey connected as you move from
                requirements to design.
              </p>

              <p className="mt-6 text-sm font-medium italic tracking-wide text-[#B9C4B1]">
                Where every square feet matters.
              </p>

            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[9px] uppercase tracking-[0.18em] text-[#8F968C]">
              <span>Personalized</span>
              <span>Space-aware</span>
              <span>Future-ready</span>
            </div>

          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10">

          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">
              <MyNestLogo />
            </div>

            <div className="mb-8">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B86F52]">
                Create your account
              </p>

              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Start building your MyNest.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#73766F]">
                Create an account to begin your personalized home-planning
                journey.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#53604F]"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full border border-[#DCD9D0] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A5A69F] focus:border-[#71806B] focus:ring-2 focus:ring-[#71806B]/10"
                />

              </div>

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#53604F]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full border border-[#DCD9D0] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A5A69F] focus:border-[#71806B] focus:ring-2 focus:ring-[#71806B]/10"
                />

              </div>

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#53604F]"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="w-full border border-[#DCD9D0] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A5A69F] focus:border-[#71806B] focus:ring-2 focus:ring-[#71806B]/10"
                />

              </div>

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#53604F]"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full border border-[#DCD9D0] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#A5A69F] focus:border-[#71806B] focus:ring-2 focus:ring-[#71806B]/10"
                />

              </div>

              {error && (
                <div className="border border-[#D8A18D] bg-[#FBEEE7] px-4 py-3 text-sm text-[#8D4D39]">
                  {error}
                </div>
              )}

              {success && (
                <div className="border border-[#AAB9A2] bg-[#EEF3EB] px-4 py-3 text-sm text-[#53604F]">
                  Account created successfully. Opening login...
                </div>
              )}

              <button
                type="submit"
                disabled={success}
                className="w-full bg-[#202421] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#53604F] disabled:opacity-60"
              >
                Create MyNest Account →
              </button>

            </form>

            <div className="mt-7 text-center text-sm text-[#73766F]">

              Already have an account?{" "}

              <Link
                to="/"
                className="font-semibold text-[#53604F] hover:text-[#B86F52]"
              >
                Sign in
              </Link>

            </div>

            <p className="mt-8 text-center text-[10px] leading-5 text-[#9A9A91]">
              Account storage is currently local to this browser.
              <br />
              MongoDB will be connected later.
            </p>

          </div>

        </section>

      </div>

    </div>
  );
}