import React, {useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { debounce } from 'lodash.debounce';
import markers from './markers.json';

const containerStyle = {
  width: '100vw',
  height: '100vh',
};

const circleThreshold = 10;

function GoogleMapApp() {
  const [allMarkers, setAllMarkers] = useState([]);
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const mapRef = useRef(null);

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

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    const bounds = new window.google.maps.LatLngBounds();

    allMarkers.forEach(({ geoCoordinates }) => {
      const location = new window.google.maps.LatLng(geoCoordinates.latitude, geoCoordinates.longitude);
      bounds.extend(location);
    });

    if (allMarkers.length > 0) map.fitBounds(bounds);
  }, [allMarkers]);

  const onBoundsChanged = useCallback(debounce(() => {
    const bounds = mapRef.current.getBounds();

    const filteredMarkers = allMarkers.filter(({ geoCoordinates }) => {
      const { latitude, longitude } = geoCoordinates;
      return bounds.contains(new window.google.maps.LatLng(latitude, longitude));
    });

    setVisibleMarkers(filteredMarkers);
  }, 100), [allMarkers]);

  const onMarkerClick = useCallback((lat, lng) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(10);
  }, []);

  const renderMarker = (marker) => {
    const { geoCoordinates, count } = marker;
    const isCrowded = count >= circleThreshold;

    let scale = 3;
    if (isCrowded) {
      if (count > 1000) scale = 14;
      else if (count > 100) scale = 12;
      else scale = 10;
    }

    const markerIcon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#3066BE',
      fillOpacity: 0.8,
      scale,
      strokeColor: '#000000',
      strokeWeight: 1,
      anchor: new window.google.maps.Point(0, 0),
      labelOrigin: new window.google.maps.Point(0, 0),
    };

    return (
      <Marker
        key={`${geoCoordinates.latitude}-${geoCoordinates.longitude}`}
        position={{
          lat: geoCoordinates.latitude,
          lng: geoCoordinates.longitude,
        }}
        icon={markerIcon}
        label={isCrowded
          ? {text: String(count), color: "#FFFFFF", fontSize: "10px"}
          : null
        }
        onClick={() => onMarkerClick(geoCoordinates.latitude, geoCoordinates.longitude)}
      />
    );
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        onLoad={onLoad}
        onBoundsChanged={onBoundsChanged}
      >
        {visibleMarkers.map((marker) => renderMarker(marker))}
      </GoogleMap>
    </LoadScript>
  )
}

export default GoogleMapApp;
