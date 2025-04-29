import React from "react";

export interface City {
  name: string;
  lat: number;
  lng: number;
}

// Sweden's 5 biggest cities with their coordinates
export const swedishCities: City[] = [
  { name: "Stockholm", lat: 59.3293, lng: 18.0686 },
  { name: "Gothenburg", lat: 57.7089, lng: 11.9746 },
  { name: "Malmö", lat: 55.605, lng: 13.0038 },
  { name: "Uppsala", lat: 59.8586, lng: 17.6389 },
  { name: "Västerås", lat: 59.6099, lng: 16.5448 },
];

interface CitySelectorProps {
  onCitySelect: (city: City) => void;
  selectedCity: City | null;
}

export default function CitySelector({
  onCitySelect,
  selectedCity,
}: CitySelectorProps) {
  return (
    <div className="w-full max-w-md mx-auto mb-4">
      <label
        htmlFor="city-select"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Select a Swedish city:
      </label>
      <select
        id="city-select"
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        value={
          selectedCity
            ? swedishCities.findIndex((city) => city.name === selectedCity.name)
            : ""
        }
        onChange={(e) => {
          const index = parseInt(e.target.value);
          if (index >= 0) {
            onCitySelect(swedishCities[index]);
          }
        }}
      >
        <option value="" disabled>
          Choose a city
        </option>
        {swedishCities.map((city, index) => (
          <option key={city.name} value={index}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
