"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavBarProps {
  onSignOut?: () => void;
}

export function NavBar({ onSignOut }: NavBarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Recepten", icon: "menu_book" },
    { href: "/favorites", label: "Favorieten", icon: "favorite" },
    { href: "/fridge", label: "Mijn Koelkast", icon: "kitchen" },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface/70 glass-nav shadow-sm" aria-label="Hoofdnavigatie">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          {/* Hamburger button — mobile only */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-primary-container/20 transition-colors"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-primary" aria-hidden="true">menu</span>
          </button>

          <Link href="/" className="text-xl sm:text-2xl font-heading italic text-primary" aria-label="Lajoy's Recipes - Home">
            Lajoy&apos;s Recipes
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 font-label tracking-tight">
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

          <div className="flex items-center gap-2 sm:gap-4">
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
                className="hidden sm:flex p-2 rounded-full hover:bg-primary-container/20 transition-colors"
                aria-label="Uitloggen"
              >
                <span className="material-symbols-outlined text-primary" aria-hidden="true">logout</span>
              </button>
            )}
            <button
              className="hidden sm:flex p-2 rounded-full hover:bg-primary-container/20 transition-colors"
              aria-label="Account instellingen"
            >
              <span className="material-symbols-outlined text-primary" aria-hidden="true">account_circle</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Navigatie menu">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-on-surface/40 transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          {/* Panel */}
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-surface shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <span className="font-heading italic text-primary text-xl">Lajoy&apos;s</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
                aria-label="Sluit menu"
              >
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-grow py-4">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 font-label text-sm transition-colors ${
                      isActive
                        ? "text-primary bg-primary-container/20 font-semibold"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Bottom actions */}
            <div className="border-t border-outline-variant/20 p-4 space-y-2">
              <button
                className="flex items-center gap-4 w-full px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors font-label text-sm"
                aria-label="Account instellingen"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">account_circle</span>
                Account
              </button>
              {onSignOut && (
                <button
                  onClick={() => { onSignOut(); setMenuOpen(false); }}
                  className="flex items-center gap-4 w-full px-4 py-3 rounded-lg text-error-lajoy hover:bg-error-container/30 transition-colors font-label text-sm"
                >
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">logout</span>
                  Uitloggen
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
