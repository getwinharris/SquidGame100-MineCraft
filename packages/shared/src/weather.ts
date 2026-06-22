/**
 * Weather system — rain, snow, thunder.
 * Matches Minecraft Java Edition weather mechanics.
 * Weather affects mob spawning, crop growth, visibility, and gameplay.
 */

export type WeatherType = 'clear' | 'rain' | 'thunder' | 'snow';

export interface WeatherState {
  type: WeatherType;
  intensity: number;       // 0-1 (rain/snow amount)
  duration: number;        // ticks remaining
  thunderTimer: number;    // ticks until next lightning
  thunderActive: boolean;  // is a thunder strike happening now
}

/**
 * Weather duration ranges in ticks (20 ticks = 1 second).
 * In Minecraft: clear=12000-18000, rain=6000-15000, thunder=3600-12000.
 */
export const WEATHER_DURATIONS = {
  clear: { min: 12000, max: 18000 },     // 10-15 minutes
  rain: { min: 6000, max: 15000 },       // 5-12.5 minutes
  thunder: { min: 3600, max: 12000 },    // 3-10 minutes
  snow: { min: 6000, max: 15000 },       // 5-12.5 minutes
};

/**
 * Get a random weather duration.
 */
export function getRandomWeatherDuration(type: WeatherType): number {
  const range = WEATHER_DURATIONS[type];
  return range.min + Math.floor(Math.random() * (range.max - range.min));
}

/**
 * Create a new weather state.
 */
export function createWeatherState(type: WeatherType): WeatherState {
  return {
    type,
    intensity: type === 'clear' ? 0 : 0.5 + Math.random() * 0.5,
    duration: getRandomWeatherDuration(type),
    thunderTimer: type === 'thunder' ? Math.floor(Math.random() * 10000) : 0,
    thunderActive: false,
  };
}

/**
 * Determine weather transition probabilities.
 * In Minecraft: ~70% chance clear after each weather event.
 */
export function getNextWeatherType(currentType: WeatherType, _biome: string): WeatherType {
  const rand = Math.random();

  if (currentType === 'clear') {
    if (rand < 0.19) return 'rain';         // 19% chance rain
    if (rand < 0.25) return 'snow';         // 6% chance snow (cold biomes)
    return 'clear';                          // 75% chance clear
  }

  if (currentType === 'rain') {
    if (rand < 0.05) return 'thunder';      // 5% chance thunder
    return 'clear';                          // 95% chance clear
  }

  if (currentType === 'thunder') {
    return 'clear';                          // 100% chance clear
  }

  if (currentType === 'snow') {
    if (rand < 0.05) return 'thunder';      // 5% chance thunder
    return 'clear';                          // 95% chance clear
  }

  return 'clear';
}

/**
 * Check if the biome should get snow instead of rain.
 * Snow: biomes with temperature < 0.15
 */
export function shouldSnow(biome: string): boolean {
  const coldBiomes = [
    'snowy_tundra', 'ice_spikes', 'frozen_river', 'frozen_ocean',
    'snowy_beach', 'snowy_taiga', 'grove', 'jagged_peaks',
    'frozen_peaks', 'snowy_slopes',
  ];
  return coldBiomes.includes(biome);
}

/**
 * Process one tick of weather.
 * Returns lightning positions if a strike occurs.
 */
export function tickWeather(
  state: WeatherState,
  biome: string,
): {
  state: WeatherState;
  lightning?: { x: number; z: number };
} {
  const newState = { ...state };
  newState.duration--;

  if (newState.duration <= 0) {
    const nextType = getNextWeatherType(newState.type, biome);
    return {
      state: createWeatherState(nextType),
    };
  }

  // Thunder logic
  if (newState.type === 'thunder' || newState.type === 'rain') {
    newState.thunderTimer--;
    if (newState.thunderTimer <= 0) {
      newState.thunderActive = true;
      newState.thunderTimer = 5000 + Math.floor(Math.random() * 10000);
      return {
        state: newState,
        lightning: {
          x: Math.floor(Math.random() * 16) - 8,
          z: Math.floor(Math.random() * 16) - 8,
        },
      };
    }
    newState.thunderActive = false;
  }

  return { state: newState };
}

/**
 * Get the rain/snow intensity for rendering.
 */
export function getWeatherIntensity(state: WeatherState): number {
  if (state.type === 'clear') return 0;
  return state.intensity;
}

/**
 * Check if weather affects crop growth (rain = growth speedup).
 */
export function isRaining(state: WeatherState): boolean {
  return state.type === 'rain' || state.type === 'thunder';
}

/**
 * Check if weather causes snowfall.
 */
export function isSnowing(state: WeatherState): boolean {
  return state.type === 'snow';
}

/**
 * Check if weather causes lightning.
 */
export function hasLightning(state: WeatherState): boolean {
  return state.type === 'thunder';
}

/**
 * Check if hostile mobs spawn more during this weather.
 */
export function getHostileSpawnMultiplier(state: WeatherState): number {
  switch (state.type) {
    case 'thunder': return 1.5;  // 50% more hostile spawns
    case 'rain': return 1.25;    // 25% more hostile spawns
    default: return 1.0;
  }
}

/**
 * Check if phantoms spawn during this weather + time.
 */
export function canSpawnPhantoms(state: WeatherState, timeOfDay: number): boolean {
  // Phantoms spawn at night when it's clear (no rain)
  const isNight = timeOfDay >= 12541 && timeOfDay <= 23458;
  return state.type === 'clear' && isNight;
}
