// UV Index API Service
// This service connects to the free UV index API to fetch current and forecast UV data

// Define TypeScript interfaces for the API response
export interface UVIndexApiResponse {
  ok: boolean;
  latitude: number;
  longitude: number;
  now: {
    time: string;
    uvi: number;
  };
  forecast: {
    time: string;
    uvi: number;
  }[];
}

// Interface for our processed UV data, similar to the existing Meteomatics interface for compatibility
export interface UVIndexData {
  uvIndex: number;
  timestamp: string;
  maxUvIndex?: number;
  maxUvTime?: string;
  hourlyForecast?: {
    time: string;
    uvIndex: number;
  }[];
  source: string;
  latitude: number;
  longitude: number;
}

// Location data interface, reused from the existing implementation
export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

const API_BASE_URL = "https://corsproxy.io/?https://currentuvindex.com/api/v1/uvi";

/**
 * Get UV Index data from the free API
 * @param location Location data with latitude and longitude
 * @returns Processed UV index data or null if an error occurs
 */
export async function getUVIndexData(location: LocationData): Promise<UVIndexData | null> {
  try {
    // Build the URL with the location parameters
    const url = `${API_BASE_URL}?latitude=${location.lat}&longitude=${location.lng}`;
    
    // Fetch data from the API
    const response = await fetch(url, { 
      cache: "no-store" // Ensure we get fresh data
    });
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`Error fetching UV index: ${response.status}`);
    }
    
    // Parse the response
    const data: UVIndexApiResponse = await response.json();
    
    // Check if the API returned a successful response
    if (!data.ok) {
      throw new Error("API returned an error response");
    }
    
    // Process the forecast data to match our internal format
    const hourlyForecast = data.forecast.map(item => ({
      time: item.time,
      uvIndex: item.uvi
    }));
    
    // Find the maximum UV index from the forecast data
    let maxUvIndex: number | undefined;
    let maxUvTime: string | undefined;
    
    if (hourlyForecast.length > 0) {
      const maxUvEntry = hourlyForecast.reduce((prev, current) =>
        prev.uvIndex > current.uvIndex ? prev : current
      );
      
      maxUvIndex = maxUvEntry.uvIndex;
      maxUvTime = maxUvEntry.time;
    }
    
    // Return the processed data
    return {
      uvIndex: data.now.uvi,
      timestamp: data.now.time,
      maxUvIndex,
      maxUvTime,
      hourlyForecast,
      source: "Current UV Index API",
      latitude: data.latitude,
      longitude: data.longitude
    };
    
  } catch (error) {
    console.error("Failed to fetch UV index data:", error);
    return null;
  }
}

/**
 * Get user's current geolocation
 * @returns Promise resolving to the user's location
 */
export function getUserLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Get coordinates for predefined Swedish cities
 * @param city The name of the city
 * @returns Location data for the requested city
 */
export function getCityCoordinates(city: string): LocationData {
  const cities: Record<string, LocationData> = {
    "Gothenburg": { lat: 57.7089, lng: 11.9746, address: "Gothenburg, Sweden" },
    "Stockholm": { lat: 59.3293, lng: 18.0686, address: "Stockholm, Sweden" },
    "Malmö": { lat: 55.6050, lng: 13.0038, address: "Malmö, Sweden" }
  };
  
  return cities[city] || cities["Stockholm"]; // Default to Stockholm if city not found
}

/**
 * Utility function to get the severity level of a UV index
 * @param uvIndex The UV index value
 * @returns Object with severity level and color
 */
export function getUVSeverity(uvIndex: number): { level: string; color: string } {
  if (uvIndex < 3) return { level: "Low", color: "bg-green-500" };
  if (uvIndex < 6) return { level: "Moderate", color: "bg-yellow-500" };
  if (uvIndex < 8) return { level: "High", color: "bg-orange-500" };
  if (uvIndex < 11) return { level: "Very High", color: "bg-red-500" };
  return { level: "Extreme", color: "bg-purple-600" };
}