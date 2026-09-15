import Link from "next/link";

export type BreadcrumbItem = Readonly<{
  label: string;
  href?: string;
}>;

export function Breadcrumbs({ items }: { items: ReadonlyArray<BreadcrumbItem> }) {
  return (
    <nav className="guide-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SiteNavigation() {
  return (
    <nav className="trust-navigation" aria-label="Site">
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/methodology">Methodology</Link>
      <Link href="/corrections">Corrections</Link>
    </nav>
  );
}
