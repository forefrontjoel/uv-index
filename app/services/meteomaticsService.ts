// Meteomatics API Service
// This service connects to the Meteomatics API to fetch UV index data

export interface MeteomaticsUVData {
  uvIndex: number;
  timestamp: string;
  maxUvIndex?: number;
  maxUvTime?: string;
  hourlyForecast?: {
    time: string;
    uvIndex: number;
  }[];
  source: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

// API credentials from environment variables
const USERNAME = process.env.NEXT_PUBLIC_METEOMATICS_USERNAME || "";
const PASSWORD = process.env.NEXT_PUBLIC_METEOMATICS_PASSWORD || "";
const BASE_URL = "https://api.meteomatics.com";

/**
 * Get UV Index data from the Meteomatics API
 */
export async function getMeteomaticsUVIndex(
  location: LocationData
): Promise<MeteomaticsUVData | null> {
  try {
    // Check if credentials are available
    if (!USERNAME || !PASSWORD) {
      console.error(
        "Meteomatics credentials not found in environment variables"
      );
      return null;
    }

    // Get current date and format it for the API
    const now = new Date();
    const formattedDate = now.toISOString().split(".")[0] + "Z"; // Format: YYYY-MM-DDTHH:MM:SSZ

    // Format the location
    const locationString = `${location.lat},${location.lng}`;

    // Build the URL for current UV index
    const currentUvUrl = `${BASE_URL}/${formattedDate}/uv:idx/${locationString}/json`;

    // Build the URL for hourly UV forecast for the next 24 hours
    const startTime = now.toISOString().split(".")[0] + "Z";
    const endTime =
      new Date(now.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split(".")[0] + "Z";
    const forecastUrl = `${BASE_URL}/${startTime}--${endTime}:PT1H/uv:idx/${locationString}/json`;

    // Create headers with basic authentication
    const headers = new Headers();
    headers.set("Authorization", "Basic " + btoa(`${USERNAME}:${PASSWORD}`));

    // Fetch current UV index
    const currentResponse = await fetch(currentUvUrl, {
      headers,
      cache: "no-store",
    });

    if (!currentResponse.ok) {
      throw new Error(`Error fetching UV index: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();

    // Fetch forecast data
    const forecastResponse = await fetch(forecastUrl, {
      headers,
      cache: "no-store",
    });

    let forecastData;
    let hourlyForecast;

    if (forecastResponse.ok) {
      forecastData = await forecastResponse.json();

      // Process forecast data if available
      if (
        forecastData &&
        forecastData.data &&
        forecastData.data[0] &&
        forecastData.data[0].coordinates &&
        forecastData.data[0].coordinates[0] &&
        forecastData.data[0].coordinates[0].dates
      ) {
        hourlyForecast = forecastData.data[0].coordinates[0].dates.map(
          (item: any) => ({
            time: item.date,
            uvIndex: item.value,
          })
        );

        // Find max UV index from the forecast
        if (hourlyForecast.length > 0) {
          const maxUvItem = hourlyForecast.reduce((prev: any, current: any) =>
            prev.uvIndex > current.uvIndex ? prev : current
          );

          const maxUvIndex = maxUvItem.uvIndex;
          const maxUvTime = maxUvItem.time;
        }
      }
    }

    // Extract current UV index
    let currentUvIndex = 0;
    let timestamp = formattedDate;

    if (
      currentData &&
      currentData.data &&
      currentData.data[0] &&
      currentData.data[0].coordinates &&
      currentData.data[0].coordinates[0] &&
      currentData.data[0].coordinates[0].dates &&
      currentData.data[0].coordinates[0].dates[0]
    ) {
      currentUvIndex = currentData.data[0].coordinates[0].dates[0].value;
      timestamp = currentData.data[0].coordinates[0].dates[0].date;
    }

    // Find max UV value and its time from the hourly forecast
    let maxUvIndex;
    let maxUvTime;

    if (hourlyForecast && hourlyForecast.length > 0) {
      const maxUvEntry = hourlyForecast.reduce((prev, current) =>
        prev.uvIndex > current.uvIndex ? prev : current
      );

      maxUvIndex = maxUvEntry.uvIndex;
      maxUvTime = maxUvEntry.time;
    }

    return {
      uvIndex: currentUvIndex,
      timestamp: timestamp,
      maxUvIndex: maxUvIndex,
      maxUvTime: maxUvTime,
      hourlyForecast: hourlyForecast,
      source: "Meteomatics Professional Weather Data",
    };
  } catch (error) {
    console.error("Failed to fetch Meteomatics UV index data:", error);
    return null;
  }
}

// Get user's current geolocation
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
