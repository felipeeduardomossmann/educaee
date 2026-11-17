interface MascoteProps {
  className?: string
}

/** Mascote: bolinha sorridente com um broto na cabeça (parado, sem animação). */
export default function Mascote({ className = 'size-40' }: MascoteProps) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      {/* broto */}
      <path
        d="M80 42 C80 32 80 26 80 20"
        stroke="#3f8f5f"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M80 28 C68 16 54 18 50 24 C58 34 72 34 80 28 Z" fill="#7cc79a" />
      <path d="M80 24 C90 10 106 10 110 16 C104 28 90 30 80 24 Z" fill="#9bd8b2" />
      {/* corpo */}
      <ellipse cx="80" cy="98" rx="58" ry="54" fill="#9cc9f2" />
      <ellipse cx="80" cy="110" rx="38" ry="32" fill="#dcebfb" />
      {/* olhos */}
      <circle cx="60" cy="88" r="9" fill="#1f2d3d" />
      <circle cx="100" cy="88" r="9" fill="#1f2d3d" />
      <circle cx="63" cy="85" r="3" fill="#fff" />
      <circle cx="103" cy="85" r="3" fill="#fff" />
      {/* bochechas */}
      <ellipse cx="46" cy="104" rx="9" ry="6" fill="#f7a8b8" opacity="0.8" />
      <ellipse cx="114" cy="104" rx="9" ry="6" fill="#f7a8b8" opacity="0.8" />
      {/* sorriso */}
      <path
        d="M68 106 Q80 118 92 106"
        stroke="#1f2d3d"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
