"use client";

import MeteomaticsUVDisplay from "./components/MeteomaticsUVDisplay";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">UV Index Tracker</h1>
        <p className="text-gray-600 mb-6">
          Get real-time UV index data for your location
        </p>
      </header>

      <main className="row-start-2 w-full">
        <MeteomaticsUVDisplay />
      </main>

      <footer className="row-start-3 text-center text-sm text-gray-500 mt-8">
        <p>
          © {new Date().getFullYear()} UV Index Tracker. Powered by Meteomatics
          Professional Weather Data.
        </p>
      </footer>
    </div>
  );
}
