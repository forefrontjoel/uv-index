"use client";

import { useState, useEffect } from "react";
import {
  CopernicusUVData,
  LocationData,
  getUserLocation,
  getCopernicusUVIndex,
} from "../services/copernicus-service";

// Helper function to determine UV index severity
const getUVSeverity = (uvIndex: number): { level: string; color: string } => {
  if (uvIndex < 3) return { level: "Low", color: "bg-green-500" };
  if (uvIndex < 6) return { level: "Moderate", color: "bg-yellow-500" };
  if (uvIndex < 8) return { level: "High", color: "bg-orange-500" };
  if (uvIndex < 11) return { level: "Very High", color: "bg-red-500" };
  return { level: "Extreme", color: "bg-purple-600" };
};

// Demo mode provides mock data if no API key is available
const useDemoMode = !process.env.NEXT_PUBLIC_WAQI_TOKEN;

export default function CopernicusUVDisplay() {
  const [uvData, setUvData] = useState<CopernicusUVData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(0);

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
              uvIndex: 5.2,
              timestamp: new Date().toISOString(),
              forecastData: {
                hourly: Array.from({ length: 24 }, (_, i) => {
                  const date = new Date();
                  date.setHours(date.getHours() + i);
                  return {
                    time: date.toISOString(),
                    uvIndex: 5.2 + Math.sin(i / 3) * 2, // Create a sine wave pattern for demo
                  };
                }),
              },
              source: "Copernicus/CAMS (Demo Data)",
            });
            setLoading(false);
          }, 1000);
        } else {
          // Fetch real data using the API
          const data = await getCopernicusUVIndex(userLocation);
          if (!data) {
            throw new Error("Unable to fetch Copernicus UV index data");
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
        <p className="mt-4 text-lg">Loading Copernicus UV index data...</p>
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
          Unable to retrieve Copernicus UV index information at this time.
        </p>
      </div>
    );
  }

  // Get current UV index data
  const currentUvIndex = uvData.uvIndex;
  const { level, color } = getUVSeverity(currentUvIndex);

  // Format the forecast data for display if available
  const hasForecast =
    uvData.forecastData &&
    uvData.forecastData.hourly &&
    uvData.forecastData.hourly.length > 0;
  const forecastHours = hasForecast
    ? uvData.forecastData!.hourly.slice(0, 24)
    : [];

  // Get the selected hour's data
  const selectedHourData =
    hasForecast && forecastHours.length > selectedHour
      ? forecastHours[selectedHour]
      : null;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <div className="p-8 w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Copernicus UV Index
            {useDemoMode && (
              <span className="ml-2 text-xs text-gray-500">(Demo Mode)</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(uvData.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div
            className={`${color} rounded-full w-32 h-32 flex items-center justify-center`}
          >
            <span className="text-4xl font-bold text-white">
              {currentUvIndex.toFixed(1)}
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

        {hasForecast && (
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-2">24-Hour UV Forecast</h3>
            <div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden">
              {/* UV Index forecast chart */}
              {forecastHours.map((hour, i) => {
                const { color } = getUVSeverity(hour.uvIndex);
                const height = `${Math.min(100, (hour.uvIndex / 11) * 100)}%`;
                return (
                  <div
                    key={i}
                    className={`absolute bottom-0 ${color} cursor-pointer hover:opacity-80 transition-opacity border-r border-white`}
                    style={{
                      left: `${(i / forecastHours.length) * 100}%`,
                      width: `${100 / forecastHours.length}%`,
                      height,
                    }}
                    onClick={() => setSelectedHour(i)}
                    title={`${new Date(hour.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}: UV ${hour.uvIndex.toFixed(1)}`}
                  />
                );
              })}
            </div>

            {/* Time labels */}
            <div className="flex justify-between mt-1 text-xs text-gray-600">
              <span>
                {new Date(forecastHours[0].time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>
                {new Date(
                  forecastHours[Math.floor(forecastHours.length / 2)].time
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>
                {new Date(
                  forecastHours[forecastHours.length - 1].time
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Selected hour details */}
            {selectedHourData && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold">
                  {new Date(selectedHourData.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  :
                  <span className="ml-1 font-bold">
                    {selectedHourData.uvIndex.toFixed(1)}
                  </span>
                  <span className="ml-1 text-gray-600">
                    ({getUVSeverity(selectedHourData.uvIndex).level})
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {location && (
          <div className="mt-4 text-xs text-gray-500">
            Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 italic text-center">
          Source: {uvData.source}
        </div>
      </div>
    </div>
  );
}
