"use client";

import LogoComponent from "./LogoComponent";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="inset-0 flex animate-float items-center justify-center">
            <LogoComponent />
          </div>
        </div>
        <span className="mt-6 text-lg font-semibold text-white drop-shadow">
          Carregando...
        </span>
      </div>
    </div>
  );
}
