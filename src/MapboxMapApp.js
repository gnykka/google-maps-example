import React, { useState, useEffect, useRef } from 'react';
import MapGL, { NavigationControl, Marker } from 'react-map-gl';
import { debounce } from 'lodash';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import markers from './markers.json';

const controlsStyle = {
  position: 'absolute',
  bottom: 10,
  right: 10,
};

const markerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#3066becc',
  border: '1px solid #000000',
  borderRadius: '50%',
  fontSize: '10px',
  color: '#ffffff'
};

const circleThreshold = 10;
const mapPadding = 50;
const markerZoom = 9;

function MapboxMapApp() {
  const [allMarkers, setAllMarkers] = useState([]);
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const mapRef = useRef(null);

  const onBoundsChanged = debounce(() => {
    const bounds = mapRef.current.getBounds();

    const filteredMarkers = allMarkers.filter(({ geoCoordinates }) => {
      const { latitude, longitude } = geoCoordinates;
      return bounds.contains(new mapboxgl.LngLat(longitude, latitude));
    });

    setVisibleMarkers(filteredMarkers);
  }, 100);

  useEffect(() => {
    const locationMap = new Map();

    markers.forEach(({ id, ipAddress, location }) => {
      const { latitude, longitude } = location.geoCoordinates;
      if (latitude && longitude) {
        const locationKey = `${latitude}-${longitude}`;

        if (!locationMap.has(locationKey)) {
          locationMap.set(locationKey, {
            count: 0,
            idIpPairs: [],
            ...location,
          });
        }

        const locationData = locationMap.get(locationKey);

        locationData.count += 1;
        locationData.idIpPairs.push({ id, ipAddress });
      }
    });

    const uniqueLocationsArray = Array
      .from(locationMap, ([, value]) => value)
      .sort((a, b) => a.count - b.count);

    setAllMarkers(uniqueLocationsArray);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.setRenderWorldCopies(false);

    map.on('moveend', onBoundsChanged);
    map.on('zoomend', onBoundsChanged);
    map.on('resize', onBoundsChanged);

    const bounds = new mapboxgl.LngLatBounds();

    allMarkers.forEach(({ geoCoordinates }) => {
      bounds.extend([geoCoordinates.longitude, geoCoordinates.latitude]);
    });

    map.fitBounds(bounds, { padding: mapPadding });
  }, [mapRef, allMarkers, onBoundsChanged]);

  const onMarkerClick = (event) => {
    mapRef.current.flyTo({
      center: event.target.getLngLat(),
      zoom: markerZoom,
      essential: true,
    });
  };

  const renderMarker = (marker) => {
    const { geoCoordinates, count } = marker;
    const isCrowded = count >= circleThreshold;

    let size = 4;
    if (isCrowded) {
      if (count > 1000) size = 26;
      else if (count > 100) size = 20;
      else size = 16;
    }

    return (
      <Marker
        key={`${geoCoordinates.latitude}-${geoCoordinates.longitude}`}
        latitude={geoCoordinates.latitude}
        longitude={geoCoordinates.longitude}
        onClick={onMarkerClick}
      >
        <div style={{ ...markerStyle, width: `${size}px`, height: `${size}px` }}>
          {isCrowded ? count : '' }
        </div>
      </Marker>
    );
  };

  return (
    <MapGL
      ref={mapRef}
      width="100vw"
      height="100vh"
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
    >
      <div style={controlsStyle}>
        <NavigationControl />
      </div>
      {visibleMarkers.map((marker) => renderMarker(marker))}
    </MapGL>
  );
}

export default MapboxMapApp;
