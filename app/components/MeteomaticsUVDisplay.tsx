"use client";

import { useState, useEffect } from "react";
import {
  LocationData,
  MeteomaticsUVData,
  getUserLocation,
  getMeteomaticsUVIndex,
} from "../services/meteomaticsService";
import CitySelector, { City, swedishCities } from "./CitySelector";

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
  const [error, setError] = useState<string | null>(null);
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(
    null
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        let userLocation: LocationData;

        if (useCurrentLocation) {
          // Get user's location
          userLocation = await getUserLocation();
        } else if (selectedCity) {
          // Use selected city's coordinates
          userLocation = {
            lat: selectedCity.lat,
            lng: selectedCity.lng,
            address: selectedCity.name,
          };
        } else {
          // Default to Stockholm if no city is selected
          const defaultCity = swedishCities[0];
          userLocation = {
            lat: defaultCity.lat,
            lng: defaultCity.lng,
            address: defaultCity.name,
          };
          setSelectedCity(defaultCity);
          setUseCurrentLocation(false);
        }

        setLocation(userLocation);

        // Fetch data from Meteomatics API
        const data = await getMeteomaticsUVIndex(userLocation);
        if (!data) {
          throw new Error("Unable to fetch UV index data from Meteomatics");
        }

        setUvData(data);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedCity, useCurrentLocation]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setUseCurrentLocation(false);
  };

  const handleUseCurrentLocation = async () => {
    setUseCurrentLocation(true);
    setSelectedCity(null);
  };

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
      </div>
    );
  }

  const { level, color } = getUVSeverity(uvData.uvIndex);

  // Format time for display
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get selected hour data
  const selectedHourData =
    selectedHourIndex !== null && uvData.hourlyForecast
      ? uvData.hourlyForecast[selectedHourIndex]
      : null;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4 flex flex-col items-center">
        <CitySelector
          onCitySelect={handleCitySelect}
          selectedCity={selectedCity}
        />
        <button
          onClick={handleUseCurrentLocation}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          Use my current location
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8 w-full">
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
              <h3 className="font-semibold text-sm mb-2">
                24-Hour UV Forecast
              </h3>
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
                      title={`${formatTime(
                        hour.time
                      )}: UV ${hour.uvIndex.toFixed(1)}`}
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
              Location:{" "}
              {location.address ||
                `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 italic text-center">
            Powered by {uvData.source}
          </div>
        </div>
      </div>
    </div>
  );
}
