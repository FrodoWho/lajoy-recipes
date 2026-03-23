"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavBarProps {
  onSignOut?: () => void;
}

export function NavBar({ onSignOut }: NavBarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Recepten" },
    { href: "/favorites", label: "Favorieten" },
    { href: "/fridge", label: "Mijn Koelkast" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/70 glass-nav shadow-sm" aria-label="Main navigation">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-heading italic text-primary" aria-label="Lajoy's Recipes - Home">
          Lajoy&apos;s Recipes
        </Link>

        <div className="hidden md:flex items-center gap-8 font-label tracking-tight" role="navigation" aria-label="Page links">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "text-primary font-semibold border-b-2 border-primary pb-1 transition-colors duration-300"
                    : "text-on-surface-variant hover:text-secondary-lajoy transition-colors duration-300"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" aria-hidden="true">
              search
            </span>
            <input
              className="bg-surface-container-highest rounded-full py-2 pl-10 pr-4 text-sm border-none focus:ring-2 focus:ring-primary w-44 md:w-64 font-label outline-none"
              placeholder="Zoek een recept..."
              type="text"
              aria-label="Zoek recepten"
            />
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-3 sm:p-2 rounded-full hover:bg-primary-container/20 transition-colors"
              aria-label="Uitloggen"
            >
              <span className="material-symbols-outlined text-primary" aria-hidden="true">logout</span>
            </button>
          )}
          <button
            className="p-3 sm:p-2 rounded-full hover:bg-primary-container/20 transition-colors"
            aria-label="Account instellingen"
          >
            <span className="material-symbols-outlined text-primary" aria-hidden="true">account_circle</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
