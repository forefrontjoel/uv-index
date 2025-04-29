"use client";

import { useState, useEffect } from "react";
import {
  LocationData,
  MeteomaticsUVData,
  getUserLocation,
  getMeteomaticsUVIndex,
} from "../services/meteomaticsService";

// Helper function to determine UV index severity
const getUVSeverity = (uvIndex: number): { level: string; color: string } => {
  if (uvIndex < 3) return { level: "Low", color: "bg-green-500" };
  if (uvIndex < 6) return { level: "Moderate", color: "bg-yellow-500" };
  if (uvIndex < 8) return { level: "High", color: "bg-orange-500" };
  if (uvIndex < 11) return { level: "Very High", color: "bg-red-500" };
  return { level: "Extreme", color: "bg-purple-600" };
};

export default function MeteomaticsUVDisplay() {
  const [uvData, setUvData] = useState<MeteomaticsUVData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(
    null
  );
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      setUsingFallbackLocation(false);

      // Track if we're using fallback location by checking location coordinates
      const defaultLocation = { lat: 59.3293, lng: 18.0686 }; // Stockholm coordinates

      // Get user's location first - this is now cached
      const userLocation = await getUserLocation();

      // Check if we got the fallback location (Stockholm)
      if (
        Math.abs(userLocation.lat - defaultLocation.lat) < 0.01 &&
        Math.abs(userLocation.lng - defaultLocation.lng) < 0.01
      ) {
        setUsingFallbackLocation(true);
      }

      setLocation(userLocation);

      // Fetch data from Meteomatics API - also now cached
      const data = await getMeteomaticsUVIndex(userLocation);
      if (!data) {
        throw new Error("Unable to fetch UV index data from Meteomatics");
      }

      setUvData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Function to manually refresh data
  const handleRefresh = () => {
    fetchData(true);
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get selected hour data
  const selectedHourData =
    selectedHourIndex !== null && uvData?.hourlyForecast
      ? uvData.hourlyForecast[selectedHourIndex]
      : null;

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
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!uvData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-yellow-700">No Data Available</h2>
        <p className="text-yellow-600 mt-2">
          Unable to retrieve UV index information from Meteomatics at this time.
        </p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { level, color } = getUVSeverity(uvData.uvIndex);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <div className="p-8 w-full relative">
        {/* Fallback location warning */}
        {usingFallbackLocation && (
          <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200">
            <p className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Using default location (Stockholm). Please enable location
              services in your browser.
            </p>
          </div>
        )}

        {/* Refresh button and loading indicator */}
        <div className="absolute top-4 right-4 flex items-center">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Refresh data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="flex justify-between items-center">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Current UV Index
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
              {uvData.uvIndex.toFixed(1)}
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

        {/* Display Max UV info if available */}
        {uvData.maxUvIndex && uvData.maxUvTime && (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Max UV Today</p>
                <p className="font-bold">{uvData.maxUvIndex.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Time</p>
                <p className="font-bold">{formatTime(uvData.maxUvTime)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hourly forecast chart */}
        {uvData.hourlyForecast && uvData.hourlyForecast.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-2">24-Hour UV Forecast</h3>
            <div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden">
              {uvData.hourlyForecast.map((hour, i) => {
                const { color } = getUVSeverity(hour.uvIndex);
                const height = `${Math.min(100, (hour.uvIndex / 11) * 100)}%`;
                return (
                  <div
                    key={i}
                    className={`absolute bottom-0 ${color} cursor-pointer hover:opacity-80 transition-opacity border-r border-white`}
                    style={{
                      left: `${(i / uvData.hourlyForecast!.length) * 100}%`,
                      width: `${100 / uvData.hourlyForecast!.length}%`,
                      height,
                    }}
                    onClick={() => setSelectedHourIndex(i)}
                    title={`${formatTime(hour.time)}: UV ${hour.uvIndex.toFixed(
                      1
                    )}`}
                  />
                );
              })}
            </div>

            {/* Time labels */}
            <div className="flex justify-between mt-1 text-xs text-gray-600">
              <span>{formatTime(uvData.hourlyForecast[0].time)}</span>
              <span>
                {formatTime(
                  uvData.hourlyForecast[
                    Math.floor(uvData.hourlyForecast.length / 2)
                  ].time
                )}
              </span>
              <span>
                {formatTime(
                  uvData.hourlyForecast[uvData.hourlyForecast.length - 1].time
                )}
              </span>
            </div>

            {/* Selected hour details */}
            {selectedHourData && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold">
                  {formatTime(selectedHourData.time)}:
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
          Powered by {uvData.source}
        </div>
      </div>
    </div>
  );
}
