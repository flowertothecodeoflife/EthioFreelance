import Link from "next/link";

export const LOGO_CIRCULAR = "/circular-logo.png";
export const LOGO_HORIZONTAL = "/horizontal-logo.png";
export const LOGO_HORIZONTAL_TRANSPARENT = "/horizontal-logo-transparent.png";

/** Source dimensions */
const INTRINSIC = {
  circular:            { width: 328, height: 328 },
  horizontal:          { width: 628, height: 195 },
  "horizontal-transparent": { width: 628, height: 195 },
} as const;

type BrandLogoProps = {
  variant?: "circular" | "horizontal" | "horizontal-transparent";
  /** Display height in pixels */
  size?: number;
  /** dark = green nav/footer; light = white page sections */
  surface?: "default" | "dark" | "light";
  /**
   * When true, applies mix-blend-lighten so the logo background disappears
   * on any dark-coloured surface (green, blue, etc.).
   * Defaults to true when surface="dark" and variant="horizontal".
   */
  blend?: boolean;
  href?: string;
  className?: string;
  linkClassName?: string;
  showLink?: boolean;
  priority?: boolean;
};

const DEFAULT_HEIGHT = {
  circular: 48,
  horizontal: 72,
  "horizontal-transparent": 72,
} as const;

export default function BrandLogo({
  variant = "horizontal",
  size,
  surface = "default",
  blend,
  href = "/",
  className = "",
  linkClassName = "",
  showLink = true,
  priority = false,
}: BrandLogoProps) {
  const isCircular = variant === "circular";
  const isTransparent = variant === "horizontal-transparent";
  const height = size ?? DEFAULT_HEIGHT[variant];
  const intrinsic = INTRINSIC[variant];
  const src = isCircular
    ? LOGO_CIRCULAR
    : isTransparent
    ? LOGO_HORIZONTAL_TRANSPARENT
    : LOGO_HORIZONTAL;

  // blend only makes sense for the opaque horizontal logo on dark surfaces
  const shouldBlend = blend ?? (surface === "dark" && !isCircular && !isTransparent);

  const img = (
    <img
      src={src}
      alt="EthioFreelance"
      width={intrinsic.width}
      height={intrinsic.height}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={`block object-contain object-left ${isCircular ? "rounded-full" : "w-auto max-w-none"} ${shouldBlend ? "mix-blend-lighten" : ""} ${className}`}
      style={{
        height: `${height}px`,
        width: isCircular ? `${height}px` : "auto",
      }}
    />
  );

  if (!showLink) return img;

  return (
    <Link href={href} className={`inline-flex items-center flex-shrink-0 ${linkClassName}`}>
      {img}
    </Link>
  );
}
