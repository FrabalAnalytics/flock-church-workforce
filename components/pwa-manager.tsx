"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaManager() {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setOnline(window.navigator.onLine);
      setDismissed(window.sessionStorage.getItem("flock:install-dismissed") === "true");
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const ios = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
      setShowIosHelp(ios && !standalone);
    });

    function connectionChanged() {
      setOnline(window.navigator.onLine);
    }
    function beforeInstall(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }
    function installed() {
      setInstallPrompt(null);
      setShowIosHelp(false);
    }

    window.addEventListener("online", connectionChanged);
    window.addEventListener("offline", connectionChanged);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch((error) => console.error("Flock service worker registration failed", error));
    }

    return () => {
      active = false;
      window.removeEventListener("online", connectionChanged);
      window.removeEventListener("offline", connectionChanged);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  function dismissInstall() {
    window.sessionStorage.setItem("flock:install-dismissed", "true");
    setDismissed(true);
  }

  return (
    <>
      {!online && (
        <div role="status" aria-live="assertive" className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-[#ead8aa] bg-[#fffaf0] px-4 py-3 shadow-[0_16px_40px_rgba(16,28,61,0.18)]">
          <div><p className="text-sm font-semibold text-[#80662f]">You are offline</p><p className="mt-0.5 text-xs text-[#8c7442]">Drafts remain on this device. Reconnect before submitting.</p></div>
        </div>
      )}
      {online && !dismissed && (installPrompt || showIosHelp) && (
        <div role="status" className="fixed bottom-3 right-3 z-[90] max-w-sm rounded-2xl border border-[#d5dff4] bg-white p-4 shadow-[0_16px_40px_rgba(16,28,61,0.16)]">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-[#253252]">Install Flock</p><p className="mt-1 text-xs leading-5 text-[#758097]">{installPrompt ? "Add Flock to this device for faster service-day access." : "In Safari, tap Share and then Add to Home Screen."}</p></div><button type="button" onClick={dismissInstall} aria-label="Dismiss install suggestion" className="text-lg leading-none text-[#8993a7]">&times;</button></div>
          {installPrompt && <button type="button" onClick={install} className="mt-3 min-h-10 w-full rounded-xl bg-[var(--color-primary)] px-4 text-xs font-semibold text-white">Install app</button>}
        </div>
      )}
    </>
  );
}
