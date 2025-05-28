// A simple test component to verify the new UV Index API service

"use client";

import { useState, useEffect } from "react";
import { LocationData, UVIndexData, getUVIndexData, getUserLocation } from "../services/uvIndexService";

export default function UVIndexServiceTest() {
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

        // Fetch data from the new UV Index API
        const data = await getUVIndexData(userLocation);
        
        if (!data) {
          throw new Error("Unable to fetch UV index data");
        }

        setUvData(data);
        console.log("UV Index API response:", data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error("Error fetching UV data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">UV Index API Test</h2>
      
      {loading && <p className="text-gray-600">Loading UV index data...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}
      
      {uvData && !loading && (
        <div>
          <p className="mb-2">
            <span className="font-semibold">Location:</span> {location?.lat.toFixed(4)}, {location?.lng.toFixed(4)}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Current UV Index:</span> {uvData.uvIndex.toFixed(1)}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Timestamp:</span> {new Date(uvData.timestamp).toLocaleString()}
          </p>
          {uvData.maxUvIndex && (
            <p className="mb-2">
              <span className="font-semibold">Maximum UV Index:</span> {uvData.maxUvIndex.toFixed(1)} 
              {uvData.maxUvTime && ` at ${new Date(uvData.maxUvTime).toLocaleTimeString()}`}
            </p>
          )}
          
          {uvData.hourlyForecast && uvData.hourlyForecast.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Hourly Forecast:</h3>
              <div className="grid grid-cols-3 gap-2">
                {uvData.hourlyForecast.slice(0, 6).map((hour, idx) => (
                  <div key={idx} className="bg-gray-100 p-2 rounded text-sm">
                    <p className="font-medium">{new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p>UV: {hour.uvIndex.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-4">Data source: {uvData.source}</p>
        </div>
      )}
    </div>
  );
}