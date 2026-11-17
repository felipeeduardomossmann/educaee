interface LogoProps {
  className?: string
}

/** Escrita "EducAEE" com o "AEE" destacado. */
export default function Logo({ className = 'text-2xl' }: LogoProps) {
  return (
    <span className={`font-extrabold tracking-tight text-tinta ${className}`}>
      Educ<span className="text-coral">AEE</span>
    </span>
  )
}
