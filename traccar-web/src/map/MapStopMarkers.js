import { useId, useEffect, useCallback } from 'react';
import { map } from './core/MapView';

const createParkingImage = (size = 36) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#C62828';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.round(size * 0.58)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', size / 2, size / 2 + 1);

  return ctx.getImageData(0, 0, size, size);
};

const MapStopMarkers = ({ stops, positions, onStopClick }) => {
  const id = useId();

  const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
  const onMouseLeave = () => (map.getCanvas().style.cursor = '');

  const onClickCallback = useCallback(
    (event) => {
      event.preventDefault();
      const feature = event.features[0];
      if (onStopClick) {
        onStopClick(feature.properties.stopIndex);
      }
    },
    [onStopClick],
  );

  useEffect(() => {
    if (!map.hasImage('stop-parking')) {
      const imageData = createParkingImage(36);
      map.addImage('stop-parking', { width: 36, height: 36, data: imageData.data });
    }

    map.addSource(id, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': 'stop-parking',
        'icon-size': 1,
        'icon-allow-overlap': true,
        'icon-anchor': 'center',
      },
    });

    map.on('mouseenter', id, onMouseEnter);
    map.on('mouseleave', id, onMouseLeave);
    map.on('click', id, onClickCallback);

    return () => {
      map.off('mouseenter', id, onMouseEnter);
      map.off('mouseleave', id, onMouseLeave);
      map.off('click', id, onClickCallback);
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, []);

  useEffect(() => {
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: stops.map((stop, i) => {
        const pos = positions[stop.start];
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [pos.longitude, pos.latitude],
          },
          properties: {
            stopIndex: i,
          },
        };
      }),
    });
  }, [stops, positions]);

  return null;
};

export default MapStopMarkers;
