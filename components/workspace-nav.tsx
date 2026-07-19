"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type WorkspaceLink = { label: string; href: string };

export function WorkspaceNav({ links }: { links: WorkspaceLink[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentHref =
    links.find((link) =>
      link.href === "/app"
        ? pathname === "/app"
        : pathname.startsWith(link.href),
    )?.href ?? links[0]?.href;

  return (
    <nav className="mt-5 lg:mt-9" aria-label="Workspace navigation">
      <label className="block lg:hidden">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#8993a7]">
          Menu
        </span>
        <select
          value={currentHref}
          onChange={(event) => router.push(event.target.value)}
          className="h-12 w-full rounded-xl border border-[#dce3f1] bg-white px-4 text-sm font-semibold text-[#34415f] shadow-sm outline-none focus:border-[#4f7df3] focus:ring-2 focus:ring-[#4f7df3]/15"
          aria-label="Choose workspace page"
        >
          {links.map((link) => (
            <option key={link.href} value={link.href}>
              {link.label}
            </option>
          ))}
        </select>
      </label>

      <div className="hidden space-y-2 lg:block">
        {links.map((link) => {
          const active = link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className={`block rounded-xl px-4 py-3 text-left text-sm font-medium transition ${active ? "bg-[#edf2ff] text-[#3e68d3]" : "text-[#68738a] hover:bg-[#f6f8fd] hover:text-[#34415f]"}`}>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
