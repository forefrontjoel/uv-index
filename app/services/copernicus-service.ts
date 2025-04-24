// Copernicus UV index data service
// This service uses the World Air Quality Index (WAQI) API, which provides
// access to various environmental data including UV index from sources like Copernicus

export interface CopernicusUVData {
  uvIndex: number;
  timestamp: string;
  forecastData?: {
    hourly: {
      time: string;
      uvIndex: number;
    }[];
  };
  source: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

// WAQI API endpoints
const WAQI_API_URL = "https://api.waqi.info";
const TOKEN = process.env.NEXT_PUBLIC_WAQI_TOKEN || "";

/**
 * Get UV Index data from the WAQI API (which includes data derived from Copernicus)
 */
export async function getCopernicusUVIndex(
  location: LocationData
): Promise<CopernicusUVData | null> {
  try {
    // First, get the nearest station ID
    const geoResponse = await fetch(
      `${WAQI_API_URL}/feed/geo:${location.lat};${location.lng}/?token=${TOKEN}`
    );

    if (!geoResponse.ok) {
      throw new Error(`Error fetching station data: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();

    // If we have a valid station
    if (geoData.status === "ok" && geoData.data) {
      // Get detailed data for this station
      const stationId = geoData.data.idx;
      const detailResponse = await fetch(
        `${WAQI_API_URL}/feed/@${stationId}/?token=${TOKEN}`
      );

      if (!detailResponse.ok) {
        throw new Error(
          `Error fetching detailed station data: ${detailResponse.status}`
        );
      }

      const detailData = await detailResponse.json();

      // Extract UV index if available
      if (detailData.status === "ok" && detailData.data) {
        // Some stations provide UV index data
        const data = detailData.data;
        let uvIndex = 0;
        let timestamp = new Date().toISOString();
        let forecasts = undefined;

        // Check if UV data is available in iaqi field
        if (data.iaqi && data.iaqi.uvi) {
          uvIndex = data.iaqi.uvi.v;
          timestamp = data.time && data.time.iso ? data.time.iso : timestamp;
        }
        // Check if forecast data is available
        else if (
          data.forecast &&
          data.forecast.daily &&
          data.forecast.daily.uvi
        ) {
          const today = data.forecast.daily.uvi[0];
          if (today) {
            uvIndex = today.avg || today.max || 0;
            timestamp = today.day
              ? new Date(today.day).toISOString()
              : timestamp;
          }
        }

        // Check for hourly forecasts if available
        if (data.forecast && data.forecast.hourly && data.forecast.hourly.uvi) {
          const hourlyUvi = data.forecast.hourly.uvi;
          forecasts = {
            hourly: hourlyUvi.map((item: any) => ({
              time: new Date(item.t).toISOString(),
              uvIndex: item.v,
            })),
          };
        }

        // Determine the source of the data
        // WAQI aggregates data from multiple sources including Copernicus/CAMS
        const source =
          data.attributions && data.attributions.length > 0
            ? data.attributions[0].name
            : "WAQI (with data from Copernicus and other sources)";

        return {
          uvIndex,
          timestamp,
          forecastData: forecasts,
          source,
        };
      }
    }

    // If we get here, we couldn't find UV data for the location
    return null;
  } catch (error) {
    console.error("Failed to fetch Copernicus UV index data:", error);
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
