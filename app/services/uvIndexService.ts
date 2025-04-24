// UV Index API service using OpenWeatherMap API (Free tier)
// Sign up at https://openweathermap.org/ to get a free API key

export interface UVIndexData {
  uv: number;
  uv_time: string;
  uv_max: number;
  uv_max_time: string;
  ozone: number | null;
  safe_exposure_time: {
    st1: number | null;
    st2: number | null;
    st3: number | null;
    st4: number | null;
    st5: number | null;
    st6: number | null;
  };
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

interface OpenWeatherMapResponse {
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    uvi: number;
  };
  daily: Array<{
    dt: number;
    sunrise: number;
    sunset: number;
    uvi: number;
  }>;
}

// OpenWeatherMap API endpoint and key
const API_URL = "https://api.openweathermap.org/data/3.0/onecall";
// In a real application, this would be in an environment variable
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || "";

export async function getUVIndex(
  location: LocationData
): Promise<UVIndexData | null> {
  try {
    // OpenWeatherMap API call
    const response = await fetch(
      `${API_URL}?lat=${location.lat}&lon=${location.lng}&exclude=minutely,hourly,alerts&units=metric&appid=${API_KEY}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Error fetching UV index: ${response.status}`);
    }

    const data: OpenWeatherMapResponse = await response.json();

    // Map OpenWeatherMap response to our UVIndexData format
    const currentTime = new Date(data.current.dt * 1000).toISOString();

    // Find maximum UV index in the daily forecast
    let maxUv = 0;
    let maxUvTime = currentTime;

    if (data.daily && data.daily.length > 0) {
      // Find max UV for today
      const today = data.daily[0];
      maxUv = today.uvi;
      maxUvTime = new Date(today.dt * 1000).toISOString();
    }

    // Create a UV index response in our format
    return {
      uv: data.current.uvi,
      uv_time: currentTime,
      uv_max: maxUv,
      uv_max_time: maxUvTime,
      ozone: null, // OpenWeatherMap doesn't provide ozone data in the free tier
      safe_exposure_time: {
        // OpenWeatherMap doesn't provide exposure time in the free tier
        // These would need to be calculated separately based on UV index
        st1: null,
        st2: null,
        st3: null,
        st4: null,
        st5: null,
        st6: null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch UV index data:", error);
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
