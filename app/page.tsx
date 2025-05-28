"use client";

import MeteomaticsUVDisplay from "./components/MeteomaticsUVDisplay";
import UVIndexServiceTest from "./components/UVIndexServiceTest";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">UV Index Tracker</h1>
        <p className="text-gray-600 mb-6">
          Get real-time UV index data for your location
        </p>
      </header>

      <main className="row-start-2 w-full grid gap-8">
        <div className="mb-8">
          <h2 className="text-center text-lg font-semibold mb-4">Old Implementation (Meteomatics)</h2>
          <MeteomaticsUVDisplay />
        </div>
        
        <div>
          <h2 className="text-center text-lg font-semibold mb-4">New Implementation (Free API)</h2>
          <UVIndexServiceTest />
        </div>
      </main>

      <footer className="row-start-3 text-center text-sm text-gray-500 mt-8">
        <p>
          © {new Date().getFullYear()} UV Index Tracker
        </p>
      </footer>
    </div>
  );
}