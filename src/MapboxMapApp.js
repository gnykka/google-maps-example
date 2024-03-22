import React, { useState, useEffect, useRef } from 'react';
import MapGL, { NavigationControl, Marker, Popup } from 'react-map-gl';
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
  color: '#ffffff',
  cursor: 'pointer',
};

const popupStyle = {
  transition: 'opacity 200ms ease-in-out',
};

const circleThreshold = 10;
const mapPadding = 50;
const markerZoom = 9;

const debounce = (callback, timeout = 100) => {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback.apply(this, args);
    }, timeout);
  };
};

function MapboxMapApp() {
  const [allMarkers, setAllMarkers] = useState([]);
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const [tooltipInfo, setTooltipInfo] = useState({ latitude: 0, longitude: 0, visible: false });
  const mapRef = useRef(null);

  const onBoundsChanged = debounce(() => {
    const bounds = mapRef.current.getBounds();

    const filteredMarkers = allMarkers
      .filter(({ geoCoordinates }) => {
        const { latitude, longitude } = geoCoordinates;
        return bounds.contains(new mapboxgl.LngLat(longitude, latitude));
      })
      .sort((a, b) => b.count - a.count);

    setVisibleMarkers(filteredMarkers);
  });

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

    const bounds = new mapboxgl.LngLatBounds();

    allMarkers.forEach(({ geoCoordinates }) => {
      bounds.extend([geoCoordinates.longitude, geoCoordinates.latitude]);
    });

    mapRef.current.fitBounds(bounds, { padding: mapPadding });
  }, [mapRef, allMarkers]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.setRenderWorldCopies(false);

    map.on('moveend', onBoundsChanged);
    map.on('zoomend', onBoundsChanged);
    map.on('resize', onBoundsChanged);
  }, [mapRef, onBoundsChanged]);

  const onMarkerClick = (event) => {
    mapRef.current.flyTo({
      center: event.target.getLngLat(),
      zoom: markerZoom,
      essential: true,
    });
  };

  const onMouseEnterMarker = (marker) => {
    setTooltipInfo({
      latitude: marker.geoCoordinates.latitude,
      longitude: marker.geoCoordinates.longitude,
      address: `${marker.city}, ${marker.state}, ${marker.countryOrRegion}`,
      count: marker.count,
      visible: true,
    });
  };

  const onMouseLeaveMarker = () => {
    setTooltipInfo({
      ...tooltipInfo,
      visible: false,
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
        <div
          style={{ ...markerStyle, width: `${size}px`, height: `${size}px` }}
          onMouseEnter={() => onMouseEnterMarker(marker)}
          onMouseLeave={onMouseLeaveMarker}
        >
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
      <Popup
        latitude={tooltipInfo.latitude}
        longitude={tooltipInfo.longitude}
        closeButton={false}
        closeOnClick={false}
        style={{ ...popupStyle, opacity: tooltipInfo.visible ? 1 : 0 }}
      >
        <strong>{tooltipInfo.address}</strong>
        <br />
        ({tooltipInfo.latitude?.toFixed(4)}, {tooltipInfo.longitude?.toFixed(4)})
        <br />
        {tooltipInfo.count} address{tooltipInfo.count === 1 ? '' : 'es'}
      </Popup>
    </MapGL>
  );
}

export default MapboxMapApp;
