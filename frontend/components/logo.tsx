export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="oklch(0.45 0.18 265)" />
          <stop offset="100%" stopColor="oklch(0.55 0.15 285)" />
        </linearGradient>
        <linearGradient id="logoBgDark" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="oklch(0.65 0.18 265)" />
          <stop offset="100%" stopColor="oklch(0.7 0.15 285)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" className="fill-[oklch(0.45_0.18_265)] dark:fill-[oklch(0.65_0.18_265)]" />
      <rect
        width="32"
        height="32"
        rx="8"
        fill="url(#logoBg)"
        className="dark:hidden"
      />
      <rect
        width="32"
        height="32"
        rx="8"
        fill="url(#logoBgDark)"
        className="hidden dark:block"
      />
      <path
        d="M8 11C8 9.89543 8.89543 9 10 9H22C23.1046 9 24 9.89543 24 11V21C24 22.1046 23.1046 23 22 23H10C8.89543 23 8 22.1046 8 21V11Z"
        fill="white"
        fillOpacity="0.12"
      />
      <path
        d="M11 13.5H21M11 17H17M11 20.5H19"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="5.5" fill="white" />
      <path
        d="M22.5 24L23.5 25L25.5 23"
        stroke="oklch(0.45 0.18 265)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-[oklch(0.65_0.18_265)]"
      />
    </svg>
  )
}
