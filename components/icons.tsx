import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      data-brand-mark="codereset"
      {...props}
    >
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#c7ff3c" />
      <path
        d="M48 21A21 21 0 1 0 50 43"
        fill="none"
        stroke="#10120f"
        strokeWidth="6"
        strokeLinecap="square"
      />
      <path d="M44 38l10 5-9 8z" fill="#10120f" />
      <path
        d="m22 25 7 7-7 7"
        fill="none"
        stroke="#10120f"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M33 37h9v4h-9z" fill="#10120f" />
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
