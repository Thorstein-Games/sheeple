"use client";

import { asset } from "@/lib/basePath";

export default function RoundTransition() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <img
        src={asset("/graze1.gif")}
        alt="A sheep grazing"
        className="mx-auto w-48 h-auto"
      />
      <p className="mt-4 text-xl font-semibold text-gray-700">
        Get ready...
      </p>
    </div>
  );
}
