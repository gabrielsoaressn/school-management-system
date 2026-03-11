import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export default function Logo({
  className = "",
  showText = true,
  size = "md",
  href = "/admin/dashboard"
}: LogoProps) {
  const sizes = {
    sm: { width: 32, height: 32, text: "text-xl" },
    md: { width: 48, height: 48, text: "text-2xl" },
    lg: { width: 64, height: 64, text: "text-4xl" },
  };

  const { width, height, text } = sizes[size];

  const logoContent = (
    <>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Pena elegante */}
        <path
          d="M75 15C75 15 65 20 55 30C45 40 35 55 30 65C25 75 22 85 20 90C20 90 18 92 20 94C22 96 24 94 24 94C29 92 39 89 49 84C59 79 74 69 84 59C94 49 99 39 99 39L75 15Z"
          fill="currentColor"
          className="text-foreground"
        />
        <path
          d="M20 94C20 94 15 88 12 82C9 76 7 68 8 62C9 56 12 52 12 52"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-foreground/60"
        />
        {/* Detalhes da pena */}
        <path
          d="M75 15L55 35M65 25L45 45M55 35L35 55M45 45L30 60"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-background"
          opacity="0.3"
        />
        {/* Ponto de tinta */}
        <circle
          cx="20"
          cy="94"
          r="3"
          fill="currentColor"
          className="text-foreground"
        />
      </svg>
      {showText && (
        <span className={`font-serif font-semibold tracking-tight ${text}`}>
          D&apos;Ávilla
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer ${className}`}>
        {logoContent}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {logoContent}
    </div>
  );
}
