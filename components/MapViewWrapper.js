import { Platform } from 'react-native';

// Native: use react-native-maps
let NativeMapView, NativeMarker;
if (Platform.OS !== 'web') {
  NativeMapView = require('react-native-maps').default;
  NativeMarker = require('react-native-maps').Marker;
}

// Web: use react-leaflet (Leaflet)
import React from 'react';
import { View, StyleSheet } from 'react-native';

// The wrapper component – it renders the appropriate map
export default function MapViewWrapper({
  style,
  region,
  children,
  onMapReady,
  mapRef,
  ...rest
}) {
  // ----- NATIVE MAP -----
  if (Platform.OS !== 'web') {
    return (
      <NativeMapView
        ref={mapRef}
        style={style}
        initialRegion={region}
        showsUserLocation={false}
        toolbarEnabled={false}
        {...rest}
      >
        {children}
      </NativeMapView>
    );
  }

  // ----- WEB MAP (Leaflet) -----
  const { MapContainer, TileLayer, Marker, useMap } = require('react-leaflet');
  const L = require('leaflet');
  const { useEffect, useState } = require('react');

  // We need a wrapper to forward the ref (for centerOnUser)
  const WebMap = ({ mapRef, children, region }) => {
    const [map, setMap] = useState(null);

    useEffect(() => {
      if (map && region) {
        map.flyTo([region.latitude, region.longitude], region.latitudeDelta ? 15 : 13, {
          duration: 1.5,
        });
      }
    }, [region, map]);

    // Expose the map instance to parent via ref
    useEffect(() => {
      if (mapRef && map) {
        mapRef.current = map;
      }
    }, [map, mapRef]);

    return (
      <MapContainer
        center={[region?.latitude || 0, region?.longitude || 0]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMap(map)}
        ref={setMap}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {children}
      </MapContainer>
    );
  };

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <WebMap mapRef={mapRef} region={region}>
        {children}
      </WebMap>
    </View>
  );
}

// Also provide a Marker component compatible with both platforms
export function MapMarker({ coordinate, title, description, children }) {
  if (Platform.OS !== 'web') {
    return (
      <NativeMarker coordinate={coordinate} title={title} description={description}>
        {children}
      </NativeMarker>
    );
  }

  const { Marker: LeafletMarker, Popup } = require('react-leaflet');
  const L = require('leaflet');

  // Create a custom Leaflet icon using the children (scooter emoji)
  const icon = L.divIcon({
    className: '',
    html: `<div style="font-size:28px; background:transparent;">🛵</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  return (
    <LeafletMarker position={[coordinate.latitude, coordinate.longitude]} icon={icon}>
      {title && (
        <Popup>
          <b>{title}</b>
          {description && <p>{description}</p>}
        </Popup>
      )}
    </LeafletMarker>
  );
}