"use client";

import React, { useRef, useEffect } from 'react';
import maplibregl, { Map, SymbolLayout } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = 'n78QC16ZyNLOiiaSFOnl';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${MAPTILER_KEY}`,
      center: [-122.26806731773178, 37.87013152722721],
      zoom: 15.5,
      pitch: 45,
      bearing: -17.6,
      canvasContextAttributes: {antialias: true}
    });

    if (!map.current) return;

    // The 'building' layer in the streets vector source contains building-height
    // data from OpenStreetMap.
    map.current.on('load', () => {

      if (!map.current) return;
      // Insert the layer beneath any symbol layer.
      const layers = map.current.getStyle().layers || [];

      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          if (layer.type === 'symbol' && 
            layer.layout && 
            (layer.layout as SymbolLayout)?.['text-field']) {
              labelLayerId = layer.id;
              break;
          }
      }

      // Uncheck to flatten buildings
      // map.current.addSource('openmaptiles', {
      //     url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
      //     type: 'vector',
      // });

      map.current.addLayer(
          {
              'id': '3d-buildings',
              'source': 'openmaptiles',
              'source-layer': 'building',
              'type': 'fill-extrusion',
              'minzoom': 15,
              'filter': ['!=', ['get', 'hide_3d'], true],
              'paint': {
                  'fill-extrusion-color': [
                      'interpolate',
                      ['linear'],
                      ['get', 'render_height'], 0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
                  ],
                  'fill-extrusion-height': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      15,
                      0,
                      16,
                      ['get', 'render_height']
                  ],
                  'fill-extrusion-base': ['case',
                      ['>=', ['get', 'zoom'], 16],
                      ['get', 'render_min_height'], 0
                  ]
              }
          },
          labelLayerId
      );
  });

  map.current.on('click', 'your-building-layer', function (event) {
    if (!map.current) return;
      const features = map.current.queryRenderedFeatures(event.point, { layers: ['your-building-layer'] });

      if (!features.length) return;

      const buildingId = features[0].id;

      // Highlight the clicked building
      map.current.setFeatureState({ source: 'your-building-source', id: buildingId }, { highlight: true });
  });

  // Optional: Clear highlight on a second click or mouseout
  map.current.on('click', 'your-building-layer', function (event) {
    if (!map.current) return;
      const features = map.current.queryRenderedFeatures(event.point, { layers: ['your-building-layer'] });

      if (!features.length) return;

      const buildingId = features[0].id;

      // Unhighlight the clicked building
      map.current.setFeatureState({ source: 'your-building-source', id: buildingId }, { highlight: false });
  });

    return () => {
      map.current?.remove();
    };
  }, []);

  return <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />;
};

export default Map;