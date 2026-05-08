import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  IconButton,
  Paper,
  Slider,
  Toolbar,
  Typography,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';

import { makeStyles } from 'tss-react/mui';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapStopMarkers from '../map/MapStopMarkers';
import { formatTime } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import MapScale from '../map/MapScale';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';
import MapOverlay from '../map/overlay/MapOverlay';

const STOP_MIN_DURATION_MS = 30 * 60 * 1000;
const STOP_SPEED_THRESHOLD = 2; // knots
const STOP_MOVEMENT_THRESHOLD_M = 50; // metres before a stop is considered ended

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatStopDuration = (ms) => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
};

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
    },
  },
  title: {
    flexGrow: 1,
  },
  slider: {
    width: '100%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formControlLabel: {
    height: '100%',
    width: '100%',
    paddingRight: theme.spacing(1),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      marginTop: theme.spacing(1),
    },
  },
  stopBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    border: '1px solid rgba(198, 40, 40, 0.3)',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(0.75, 1.5),
    marginTop: theme.spacing(1),
  },
  stopList: {
    marginTop: theme.spacing(1.5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
    maxHeight: 180,
    overflowY: 'auto',
  },
  stopItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 1),
    borderRadius: theme.spacing(1),
    cursor: 'pointer',
    border: '1px solid rgba(198, 40, 40, 0.2)',
    backgroundColor: 'rgba(198, 40, 40, 0.04)',
    '&:hover': {
      backgroundColor: 'rgba(198, 40, 40, 0.1)',
    },
  },
  stopItemActive: {
    backgroundColor: 'rgba(198, 40, 40, 0.15)',
    border: '1px solid rgba(198, 40, 40, 0.5)',
  },
}));

const ReplayPage = () => {
  const t = useTranslation();
  const { classes, cx } = useStyles();
  const navigate = useNavigate();
  const timerRef = useRef();

  const [searchParams, setSearchParams] = useSearchParams();

  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [showCard, setShowCard] = useState(false);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStopIndex, setSelectedStopIndex] = useState(null);
  const [stopCardMinimized, setStopCardMinimized] = useState(false);

  const loaded = Boolean(from && to && !loading && positions.length);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  const stops = useMemo(() => {
    if (!positions.length) return [];
    const result = [];
    let stopStart = null; // { index, lat, lon }

    positions.forEach((pos, i) => {
      const isSlow = (pos.speed ?? 0) < STOP_SPEED_THRESHOLD;

      if (!stopStart) {
        if (isSlow) stopStart = { index: i, lat: pos.latitude, lon: pos.longitude };
        return;
      }

      const dist = haversineDistance(stopStart.lat, stopStart.lon, pos.latitude, pos.longitude);
      if (dist > STOP_MOVEMENT_THRESHOLD_M) {
        const duration =
          new Date(positions[i - 1].fixTime).getTime() -
          new Date(positions[stopStart.index].fixTime).getTime();
        if (duration >= STOP_MIN_DURATION_MS) {
          result.push({
            start: stopStart.index,
            end: i - 1,
            startTime: positions[stopStart.index].fixTime,
            endTime: positions[i - 1].fixTime,
            duration,
          });
        }
        stopStart = isSlow ? { index: i, lat: pos.latitude, lon: pos.longitude } : null;
      }
    });

    if (stopStart) {
      const duration =
        new Date(positions[positions.length - 1].fixTime).getTime() -
        new Date(positions[stopStart.index].fixTime).getTime();
      if (duration >= STOP_MIN_DURATION_MS) {
        result.push({
          start: stopStart.index,
          end: positions.length - 1,
          startTime: positions[stopStart.index].fixTime,
          endTime: positions[positions.length - 1].fixTime,
          duration,
        });
      }
    }

    return result;
  }, [positions]);

  const currentStop = useMemo(
    () => stops.find((s) => index >= s.start && index <= s.end),
    [stops, index],
  );

  useEffect(() => {
    if (!from && !to) {
      setPositions([]);
    }
  }, [from, to, setPositions]);

  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex((index) => index + 1);
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, positions]);

  useEffect(() => {
    if (index >= positions.length - 1) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [index, positions]);

  const onPointClick = useCallback(
    (_, index) => {
      setIndex(index);
    },
    [setIndex],
  );

  const onMarkerClick = useCallback(
    (positionId) => {
      setShowCard(!!positionId);
    },
    [setShowCard],
  );

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const deviceId = deviceIds.find(() => true);
    setLoading(true);
    setSelectedDeviceId(deviceId);
    const query = new URLSearchParams({ deviceId, from, to });
    try {
      const response = await fetchOrThrow(`/api/positions?${query.toString()}`);
      setIndex(0);
      const positions = await response.json();
      setPositions(positions);
      if (!positions.length) {
        throw Error(t('sharedNoData'));
      }
    } finally {
      setLoading(false);
    }
  });

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  const maxIndex = Math.max(positions.length - 1, 1);

  return (
    <div className={classes.root}>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapRoutePath positions={positions} />
        <MapRoutePoints positions={positions} onClick={onPointClick} showSpeedControl />
        {index < positions.length && (
          <MapPositions
            positions={[positions[index]]}
            onMarkerClick={onMarkerClick}
            titleField="fixTime"
          />
        )}
        {stops.length > 0 && (
          <MapStopMarkers
            stops={stops}
            positions={positions}
            onStopClick={setSelectedStopIndex}
          />
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />
      <div className={classes.sidebar}>
        <Paper elevation={3} square>
          <Toolbar>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              {t('reportReplay')}
            </Typography>
            {loaded && (
              <>
                <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => updateReportParams(searchParams, setSearchParams, 'ignore', [])}
                >
                  <TuneIcon />
                </IconButton>
              </>
            )}
          </Toolbar>
        </Paper>
        <Paper className={classes.content} square>
          {loaded && (
            <>
              <Typography variant="subtitle1" align="center">
                {deviceName}
              </Typography>

              {/* Slider with stop zones overlay */}
              <Box position="relative" pt={1}>
                <Slider
                  className={classes.slider}
                  max={positions.length - 1}
                  step={null}
                  marks={positions.map((_, i) => ({ value: i }))}
                  value={index}
                  onChange={(_, i) => setIndex(i)}
                />
                {/* Stop zone bars under slider */}
                {stops.map((stop, i) => (
                  <Tooltip
                    key={i}
                    title={`Arrêt ${i + 1} — ${formatStopDuration(stop.duration)}`}
                    placement="top"
                  >
                    <Box
                      onClick={() => setIndex(stop.start)}
                      sx={{
                        position: 'absolute',
                        left: `${(stop.start / maxIndex) * 100}%`,
                        width: `${((stop.end - stop.start) / maxIndex) * 100}%`,
                        bottom: 0,
                        height: 5,
                        bgcolor: '#C62828',
                        borderRadius: 1,
                        opacity: 0.75,
                        cursor: 'pointer',
                        zIndex: 1,
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>

              <div className={classes.controls}>
                {`${index + 1}/${positions.length}`}
                <IconButton
                  onClick={() => setIndex((index) => index - 1)}
                  disabled={playing || index <= 0}
                >
                  <FastRewindIcon />
                </IconButton>
                <IconButton
                  onClick={() => setPlaying(!playing)}
                  disabled={index >= positions.length - 1}
                >
                  {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton
                  onClick={() => setIndex((index) => index + 1)}
                  disabled={playing || index >= positions.length - 1}
                >
                  <FastForwardIcon />
                </IconButton>
                {formatTime(positions[index].fixTime, 'seconds')}
              </div>

              {/* Current stop banner */}
              {currentStop && (
                <Box className={classes.stopBanner}>
                  <PauseCircleFilledIcon sx={{ color: '#C62828', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: '#C62828', fontWeight: 600 }}>
                    {`Arrêt en cours — ${formatStopDuration(currentStop.duration)}`}
                  </Typography>
                </Box>
              )}

              {/* Stop list */}
              {stops.length > 0 && (
                <Box mt={1.5}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {`Arrêts > 30 min (${stops.length})`}
                  </Typography>
                  <Box className={classes.stopList}>
                    {stops.map((stop, i) => (
                      <Box
                        key={i}
                        className={cx(
                          classes.stopItem,
                          currentStop === stop && classes.stopItemActive,
                        )}
                        onClick={() => setIndex(stop.start)}
                      >
                        <PauseCircleFilledIcon sx={{ color: '#C62828', fontSize: 16, flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" display="block" noWrap sx={{ fontWeight: 600 }}>
                            {`${formatTime(stop.startTime, 'minutes')} → ${formatTime(stop.endTime, 'minutes')}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            {formatStopDuration(stop.duration)}
                          </Typography>
                        </Box>
                        <Chip
                          label={`#${i + 1}`}
                          size="small"
                          sx={{
                            bgcolor: '#C62828',
                            color: '#fff',
                            height: 18,
                            fontSize: '0.65rem',
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
          <div style={{ display: loaded ? 'none' : 'block' }}>
            <ReportFilter onShow={onShow} deviceType="single" loading={loading} />
          </div>
        </Paper>
      </div>
      {showCard && index < positions.length && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={positions[index]}
          onClose={() => setShowCard(false)}
          disableActions
        />
      )}
      {selectedStopIndex !== null && stops[selectedStopIndex] && (() => {
        const stop = stops[selectedStopIndex];
        const pos = positions[stop.start];
        return (
          <Paper
            elevation={6}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 10,
              p: stopCardMinimized ? '6px 10px' : 2,
              minWidth: stopCardMinimized ? 'unset' : 230,
              maxWidth: stopCardMinimized ? 'unset' : 280,
              borderTop: '3px solid #C62828',
              transition: 'all 0.2s ease',
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: '#C62828',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 12, lineHeight: 1 }}>P</Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
                {`#${selectedStopIndex + 1}`}
                {stopCardMinimized && (
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#C62828', fontWeight: 600 }}>
                    {` — ${formatStopDuration(stop.duration)}`}
                  </Typography>
                )}
              </Typography>
              <IconButton size="small" onClick={() => setStopCardMinimized((v) => !v)} sx={{ p: 0.25 }}>
                <Typography sx={{ fontSize: 14, lineHeight: 1, color: '#888' }}>
                  {stopCardMinimized ? '▲' : '▼'}
                </Typography>
              </IconButton>
              <IconButton size="small" onClick={() => { setSelectedStopIndex(null); setStopCardMinimized(false); }} sx={{ p: 0.25 }}>
                <Typography sx={{ fontSize: 14, lineHeight: 1, color: '#888' }}>✕</Typography>
              </IconButton>
            </Box>
            {!stopCardMinimized && (
              <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
                <Typography variant="caption" display="block">
                  <b>Durée :</b>{' '}
                  <span style={{ color: '#C62828', fontWeight: 600 }}>{formatStopDuration(stop.duration)}</span>
                </Typography>
                <Typography variant="caption" display="block">
                  <b>Début :</b> {formatTime(stop.startTime, 'minutes')}
                </Typography>
                <Typography variant="caption" display="block">
                  <b>Fin :</b> {formatTime(stop.endTime, 'minutes')}
                </Typography>
                <Typography variant="caption" display="block">
                  <b>Position :</b> {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
                </Typography>
                {pos.speed !== undefined && (
                  <Typography variant="caption" display="block">
                    <b>Vitesse :</b> {Math.round(pos.speed * 1.852)} km/h
                  </Typography>
                )}
                {pos.address && (
                  <Typography variant="caption" display="block" noWrap>
                    <b>Adresse :</b> {pos.address}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        );
      })()}
    </div>
  );
};

export default ReplayPage;
