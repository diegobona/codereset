import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" {...props}>
      <path d="M4 4h32v32H4z" fill="currentColor" />
      <path d="M12 11h16v4H12zm0 7h10v4H12zm0 7h16v4H12z" fill="#10120f" />
      <path d="M26 18h2v4h-2z" fill="#10120f" />
    </svg>
  );
}

export function Crosshair(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" {...props}>
      <circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" />
      <circle cx="40" cy="40" r="13" fill="none" stroke="currentColor" />
      <path d="M40 2v20M40 58v20M2 40h20M58 40h20" stroke="currentColor" />
      <circle cx="40" cy="40" r="3" fill="currentColor" />
    </svg>
  );
}
