"use client";

import { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Use raw Leaflet to completely bypass react-leaflet Next.js Strict Mode bugs
import L from "leaflet";
import { apiFetch } from "@/lib/api";
L.Icon.Default.imagePath = "/images/";

interface CropFieldFeature {
  type: string;
  id: number;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    field_id: string;
    crop: string;
    year: number;
    ndvi_mean: number;
    soil_ph: number;
    fertility_index: number;
    crop_type?: string;
    ndvi?: number;
    soil_moisture?: number;
    temperature?: number;
  };
}

interface CropMapProps {
  selectedCrop?: string;
  year?: number;
}

const colorMap: Record<string, string> = {
  wheat: "#f5deb3",
  corn: "#ffeb3b",
  cotton: "#ffffff",
  rice: "#8bc34a",
  tomato: "#f44336",
  potato: "#8d6e63",
  alfalfa: "#4caf50",
  other: "#9e9e9e",
};

export default function CropMap({ selectedCrop, year = 2024 }: CropMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const [features, setFeatures] = useState<CropFieldFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        let url = `/api/ai/fields/map/?year=${year}`;
        if (selectedCrop && selectedCrop !== "all") {
          url += `&crop=${selectedCrop}`;
        }
        const res = await apiFetch(url);
        if (!res.ok) throw new Error("Failed to fetch map data");
        const data = await res.json();
        setFeatures(data.features || []);
      } catch (err) {
        console.error(err);
        setError("Could not load map data");
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [selectedCrop, year]);

  // Handle map rendering
  useEffect(() => {
    if (loading || error || !mapRef.current) return;

    // Default center
    let center: [number, number] = [26.8206, 30.8025];
    let zoom = 5;

    if (features.length > 0) {
      center = [features[0].geometry.coordinates[1], features[0].geometry.coordinates[0]];
      zoom = 8;
    }

    // Initialize map or update view
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
    } else {
      mapInstance.current.setView(center, zoom);
      // Clear existing markers before drawing new ones
      mapInstance.current.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          layer.remove();
        }
      });
    }

    // Draw markers
    features.forEach((feature) => {
      const { coordinates } = feature.geometry;
      const { crop_type, id, ndvi, soil_moisture, temperature } = feature.properties;
      const cType = crop_type || "Unknown";
      const color = colorMap[cType.toLowerCase()] || colorMap.other;

      const marker = L.circleMarker([coordinates[1], coordinates[0]], {
        radius: 6,
        fillColor: color,
        color: "#333",
        weight: 1,
        fillOpacity: 0.8
      });

      const popupHtml = `
        <div class="p-1">
          <h3 class="font-bold text-sm mb-1">${cType.charAt(0).toUpperCase() + cType.slice(1)} Field</h3>
          <div class="text-xs space-y-1">
            <p><strong>ID:</strong> ${id || "N/A"}</p>
            <p><strong>NDVI:</strong> ${ndvi !== null && ndvi !== undefined ? Number(ndvi).toFixed(2) : "N/A"}</p>
            <p><strong>Soil Moisture:</strong> ${soil_moisture !== null && soil_moisture !== undefined ? Number(soil_moisture).toFixed(1) + "%" : "N/A"}</p>
            <p><strong>Temperature:</strong> ${temperature !== null && temperature !== undefined ? Number(temperature).toFixed(1) + "°C" : "N/A"}</p>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(mapInstance.current!);
    });

    // Clean up on unmount completely (The radical fix)
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading, error, features]);

  if (loading) {
    return <div className="h-[400px] flex items-center justify-center bg-muted/20">Loading Map Data...</div>;
  }

  if (error) {
    return <div className="h-[400px] flex items-center justify-center bg-destructive/10 text-destructive">{error}</div>;
  }

  return (
    <div className="relative h-[400px] w-full rounded-md overflow-hidden z-0">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-2 rounded-md shadow-md border text-xs z-[400]">
        <h4 className="font-bold mb-2">Crop Types</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(colorMap).map(([crop, color]) => (
            <div key={crop} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: color }}></span>
              <span className="capitalize">{crop}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
