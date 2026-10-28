function Logo({ showText = true }) {
  return (
    <div className="flex items-center gap-3">
      {/* MyNest architectural mark */}
      <svg
        width="42"
        height="42"
        viewBox="0 0 42 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="40"
          height="40"
          rx="12"
          stroke="#71806B"
          strokeWidth="1.5"
        />

        {/* Architectural roof / N form */}
        <path
          d="M11 28V17L21 10L31 17V28"
          stroke="#202421"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M15 28V20L21 16L27 20V28"
          stroke="#71806B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central N */}
        <path
          d="M17 25L25 19V28"
          stroke="#B86F52"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className="leading-none">
          <div className="text-xl font-semibold tracking-[0.18em] text-[#202421]">
            MYNEST
          </div>

          <div className="mt-1 text-[9px] tracking-[0.22em] text-[#73766F]">
            SMART HOME PLANNING
          </div>
        </div>
      )}
    </div>
  )
}

export default Logo