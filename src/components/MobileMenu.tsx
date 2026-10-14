"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { NavItem } from "@/lib/site";

interface MobileMenuProps {
  items: readonly NavItem[];
  orderHref: string;
}

/** Menu mobilne (poniżej lg): przycisk-hamburger + rozwijany panel. */
export function MobileMenu({ items, orderHref }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-16 border-b border-line bg-paper shadow-lift"
      >
        <nav aria-label="Menu mobilne" className="container-x py-4">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-cream"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={orderHref} onClick={close} className="btn-primary mt-3 w-full">
            Zamów wizualizację
          </Link>
        </nav>
      </div>
    </div>
  );
}
