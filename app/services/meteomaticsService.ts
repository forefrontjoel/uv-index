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

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache storage
interface CacheItem {
  data: MeteomaticsUVData;
  timestamp: number;
}
let uvDataCache: CacheItem | null = null;
let locationCache: LocationData | null = null;

/**
 * Get UV Index data from the Meteomatics API
 */
export async function getMeteomaticsUVIndex(
  location: LocationData
): Promise<MeteomaticsUVData | null> {
  try {
    // Check cache first
    if (
      uvDataCache &&
      Date.now() - uvDataCache.timestamp < CACHE_DURATION &&
      locationCache?.lat === location.lat &&
      locationCache?.lng === location.lng
    ) {
      console.log("Using cached UV data");
      return uvDataCache.data;
    }

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

    // Fetch both current and forecast data in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentUvUrl, {
        headers,
        cache: "default", // Use browser's standard caching
      }),
      fetch(forecastUrl, {
        headers,
        cache: "default", // Use browser's standard caching
      }),
    ]);

    if (!currentResponse.ok) {
      throw new Error(`Error fetching UV index: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();

    let hourlyForecast;
    let maxUvIndex;
    let maxUvTime;

    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json();

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

          maxUvIndex = maxUvItem.uvIndex;
          maxUvTime = maxUvItem.time;
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

    const result = {
      uvIndex: currentUvIndex,
      timestamp: timestamp,
      maxUvIndex: maxUvIndex,
      maxUvTime: maxUvTime,
      hourlyForecast: hourlyForecast,
      source: "Meteomatics Professional Weather Data",
    };

    // Update the cache
    uvDataCache = {
      data: result,
      timestamp: Date.now(),
    };
    locationCache = location;

    return result;
  } catch (error) {
    console.error("Failed to fetch Meteomatics UV index data:", error);
    return null;
  }
}

// Cached geolocation data
let cachedLocation: LocationData | null = null;
let locationPromise: Promise<LocationData> | null = null;

// Default location - Stockholm, Sweden
const DEFAULT_LOCATION: LocationData = { lat: 59.3293, lng: 18.0686 };

// Helper function to get error message based on error code
const getGeolocationErrorMessage = (
  error: GeolocationPositionError
): string => {
  switch (error.code) {
    case 1:
      return "Permission denied. Please enable location access in your browser settings.";
    case 2:
      return "Location unavailable. Your device couldn't determine your position.";
    case 3:
      return "Location request timed out. Please try again.";
    default:
      return `Geolocation error: ${error.message || "Unknown error"}`;
  }
};

// Get user's current geolocation
export function getUserLocation(): Promise<LocationData> {
  // Return cached location if available
  if (cachedLocation) {
    return Promise.resolve(cachedLocation);
  }

  // Return existing promise if we're already fetching
  if (locationPromise) {
    return locationPromise;
  }

  locationPromise = new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      cachedLocation = DEFAULT_LOCATION;
      resolve(DEFAULT_LOCATION);
      return;
    }

    // Use a timeout to avoid long waits for geolocation
    const timeoutId = setTimeout(() => {
      // Default to a fallback location if geolocation takes too long
      console.warn("Geolocation timed out, using fallback location");
      cachedLocation = DEFAULT_LOCATION;
      resolve(DEFAULT_LOCATION);
      locationPromise = null;
    }, 5000); // 5 second timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        cachedLocation = location;
        resolve(location);
        locationPromise = null;
      },
      (error) => {
        clearTimeout(timeoutId);
        // Log detailed error message
        const errorMessage = getGeolocationErrorMessage(error);
        console.warn(errorMessage);

        // Fall back to a default location on error
        cachedLocation = DEFAULT_LOCATION;
        resolve(DEFAULT_LOCATION); // Resolve with fallback rather than rejecting
        locationPromise = null;
      },
      {
        enableHighAccuracy: false, // No need for high accuracy for weather data
        timeout: 8000, // 8-second timeout (increased from 4s)
        maximumAge: 1000 * 60 * 60, // Accept positions up to an hour old
      }
    );
  });

  return locationPromise;
}
