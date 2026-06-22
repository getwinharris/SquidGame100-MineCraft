# Issue: Real Earth Terrain Data

## Priority: HIGH
## Status: OPEN

## Description
Replace procedural noise terrain with real Earth elevation and biome data from OpenStreetMap/SRTM/ETOPO1.

## Requirements
- Real elevation data from SRTM or ETOPO1
- Real biomes from Wikipedia/OpenStreetMap data
- Oceans at correct depths
- Mountains at correct heights (Everest ~29,032 ft = 29,032 blocks)
- Rivers following real paths
- Coastlines matching real Earth

## Data Sources
- SRTM (Shuttle Radar Topography Mission) - 30m resolution
- ETOPO1 - 1 arc-minute global relief
- OpenStreetMap - roads, buildings, land use
- Natural Earth - biomes, ecoregions

## Acceptance Criteria
- [ ] Terrain elevation matches real Earth
- [ ] Biomes correspond to real-world locations
- [ ] Oceans are at correct depth
- [ ] Mountains are at correct height
- [ ] Player can spawn at their GPS location
- [ ] Streaming loads chunks around player

## Wiki Reference
https://minecraft.wiki/w/World_generation
