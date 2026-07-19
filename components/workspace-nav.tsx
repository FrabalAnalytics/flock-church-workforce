"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type WorkspaceLink = { label: string; href: string };

export function WorkspaceNav({ links }: { links: WorkspaceLink[] }) {
  const pathname = usePathname();
  return (
    <nav className="mt-5 grid grid-cols-2 gap-2 pb-1 sm:grid-cols-3 lg:mt-9 lg:block lg:space-y-2" aria-label="Workspace navigation">
      {links.map((link) => {
        const active = link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={`block rounded-xl px-3 py-3 text-center text-sm font-medium transition lg:px-4 lg:text-left ${active ? "bg-[#edf2ff] text-[#3e68d3]" : "text-[#68738a] hover:bg-[#f6f8fd] hover:text-[#34415f]"}`}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
