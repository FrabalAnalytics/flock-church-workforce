import Image from "next/image";
import flockLogo from "@/public/flock_app_logo.png";

export function FlockBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${
        compact ? "h-[72px] w-[112px]" : "h-[84px] w-[132px]"
      }`}
      aria-label="Flock"
    >
      <Image
        src={flockLogo}
        alt="Flock"
        priority
        className={`absolute max-w-none ${
          compact
            ? "-left-[67px] -top-[31px] w-[235px]"
            : "-left-[79px] -top-[36px] w-[278px]"
        }`}
      />
    </div>
  );
}
