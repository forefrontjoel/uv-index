"use client";

import { useState, useEffect } from "react";
import {
  UVIndexData,
  LocationData,
  getUserLocation,
  getUVIndex,
} from "../services/uvIndexService";

// Helper function to determine UV index severity
const getUVSeverity = (uvIndex: number): { level: string; color: string } => {
  if (uvIndex < 3) return { level: "Low", color: "bg-green-500" };
  if (uvIndex < 6) return { level: "Moderate", color: "bg-yellow-500" };
  if (uvIndex < 8) return { level: "High", color: "bg-orange-500" };
  if (uvIndex < 11) return { level: "Very High", color: "bg-red-500" };
  return { level: "Extreme", color: "bg-purple-600" };
};

// Demo mode provides mock data if no API key is available
const useDemoMode = !process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

export default function UVIndexDisplay() {
  const [uvData, setUvData] = useState<UVIndexData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Get user's location
        const userLocation = await getUserLocation();
        setLocation(userLocation);

        if (useDemoMode) {
          // Mock data for demonstration purposes
          setTimeout(() => {
            setUvData({
              uv: 5.2,
              uv_time: new Date().toISOString(),
              uv_max: 7.8,
              uv_max_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
              ozone: 300.5,
              safe_exposure_time: {
                st1: 30,
                st2: 24,
                st3: 18,
                st4: 15,
                st5: 12,
                st6: 10,
              },
            });
            setLoading(false);
          }, 1000);
        } else {
          // Fetch real data using the API
          const data = await getUVIndex(userLocation);
          if (!data) {
            throw new Error("Unable to fetch UV index data");
          }
          setUvData(data);
          setLoading(false);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading UV index data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-red-700">Error</h2>
        <p className="text-red-600 mt-2">{error}</p>
        <p className="mt-4 text-sm text-gray-600">
          {useDemoMode
            ? "Demo mode is enabled, but there was an error."
            : "Make sure you have set the API key correctly."}
        </p>
      </div>
    );
  }

  if (!uvData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-yellow-700">No Data Available</h2>
        <p className="text-yellow-600 mt-2">
          Unable to retrieve UV index information at this time.
        </p>
      </div>
    );
  }

  const { level, color } = getUVSeverity(uvData.uv);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <div className="md:flex">
        <div className="p-8 w-full">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Current UV Index
            {useDemoMode && (
              <span className="ml-2 text-xs text-gray-500">(Demo Mode)</span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div
              className={`${color} rounded-full w-32 h-32 flex items-center justify-center`}
            >
              <span className="text-4xl font-bold text-white">
                {uvData.uv.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold">{level}</h2>
            <p className="mt-1 text-gray-600">
              {level === "Low" &&
                "Low danger from UV rays. No protection needed."}
              {level === "Moderate" &&
                "Moderate risk from UV rays. Wear sunscreen."}
              {level === "High" &&
                "High risk from UV rays. Wear sunscreen and protective clothing."}
              {level === "Very High" &&
                "Very high risk from UV rays. Take extra precautions."}
              {level === "Extreme" &&
                "Extreme risk from UV rays. Avoid being outside during midday hours."}
            </p>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Max UV Today</p>
                <p className="font-bold">{uvData.uv_max.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Time</p>
                <p className="font-bold">
                  {new Date(uvData.uv_max_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {location && (
            <div className="mt-4 text-xs text-gray-500">
              Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 italic text-center">
            Data provided by OpenWeatherMap
          </div>
        </div>
      </div>
    </div>
  );
}
