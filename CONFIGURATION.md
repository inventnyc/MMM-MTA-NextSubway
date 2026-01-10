# MMM-MTA-NextSubway Configuration Guide

## Features

This module now supports:
- **Automatic feed URL detection** - Just specify routeIds and the correct feeds are automatically fetched!
- **Stop name display** - Shows human-readable station names (e.g., "45 St" instead of "R39N")
- **Stop ID validation** - Validates configured stop IDs against MTA's stops.txt database
- **Multiple feed URLs** - Combine data from different MTA GTFS feeds
- **Array filtering** - Filter by multiple route IDs and stop IDs
- **Flexible configuration** - Use single values or arrays for all filters

## Configuration Options

### ⭐ Recommended: Auto-detect feeds from routes (EASY!)

Just specify the train lines you want, and the module automatically fetches the correct feeds:

```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: ["N", "Q", "R"],  // Automatically fetches NQRW feed
    stopIds: ["D43S"],           // Optional: filter by stop
    updateInterval: 30000
  }
}
```

**The module knows which feed each route belongs to!** No need to specify feed URLs.

### Cross-line routes

If you want trains from multiple lines (e.g., N, Q, R, and A trains), just list them all. The module will automatically fetch multiple feeds:

```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: ["N", "Q", "A", "L"],  // Auto-fetches NQRW, ACE, and L feeds
    updateInterval: 30000
  }
}
```

### Filter by Stop IDs

Filter for specific stations/stops:

```javascript
config: {
  routeIds: ["N", "Q", "R"],
  stopIds: ["D43S", "R36S"],  // Only show these stops
  updateInterval: 30000
}
```

**Note:** The module will validate stop IDs against the stops.txt database and display human-readable station names (e.g., "Times Sq-42 St" instead of just the stop ID).

### Stop Names and Validation

The module automatically:
- **Validates stop IDs** - Warns you if a configured stop ID doesn't exist
- **Displays stop names** - Shows "45 St (R39N)" instead of just "R39N"
- **1,488 stops included** - Complete NYC subway system stop database

When you start the module, you'll see:
```
[MMM-MTA-NextSubway] Monitoring stops: R39N (45 St), R39S (45 St)
```

If you configure an invalid stop:
```
[MMM-MTA-NextSubway] Invalid stop IDs in config: XYZ123
[MMM-MTA-NextSubway] These stops will be ignored. Check stops.txt for valid stop IDs.
```

### Single Route or Stop

You can use a single value instead of an array:

```javascript
config: {
  routeIds: "N",      // Just the N train
  stopIds: "D43S",    // Just one stop
  updateInterval: 30000
}
```

## Advanced Configuration

### Manual Feed URLs (Override)

If you need to manually specify feed URLs (advanced users only):

```javascript
config: {
  feedUrls: [
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
    "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace"
  ],
  routeIds: ["N", "Q", "A"],  // Still filtered
  updateInterval: 30000
}
```

**Note:** This overrides automatic detection. Only use if you need custom feed configurations.

## Route-to-Feed Mapping

The module automatically knows which feed each route belongs to:

| Routes | Feed |
|--------|------|
| A, C, E, SR | ACE Feed |
| G | G Feed |
| N, Q, R, W | NQRW Feed |
| 1, 2, 3, 4, 5, 6, 7, S | 1234567 Feed |
| B, D, F, M, SF | BDFM Feed |
| J, Z | JZ Feed |
| L | L Feed |
| SIR | Staten Island Railway Feed |

## How It Works

1. **You specify routeIds** - e.g., `["N", "Q", "A"]`
2. **Module determines feeds** - NQRW feed (for N, Q) + ACE feed (for A)
3. **Fetches feeds in parallel** - All feeds are fetched simultaneously
4. **Combines entities** - All trip updates from all feeds are merged
5. **Applies filters** - Only matching routes and stops are returned

## Filter Logic

- If **no filters** are specified, all entities from auto-detected feeds are returned
- If **routeIds** is specified, feeds are auto-detected AND entities are filtered by route
- If **stopIds** is specified, only entities with at least one matching stop are included
- If **both** are specified, entities must match BOTH conditions (AND logic)

## Configuration Priority

The module uses this priority order:

1. **Manual `feedUrls`** - If specified, uses these (overrides everything)
2. **Single `feedUrl`** - Legacy support for single feed
3. **Auto-detect from `routeIds`** - ⭐ Recommended approach
4. **Default** - NQRW feed if nothing specified

## Examples

### Example 1: Simple station monitor

Show N train arrivals at one stop (easiest config):

```javascript
config: {
  routeIds: "N",
  stopIds: "D43S",
  updateInterval: 30000
}
```

### Example 2: Multiple trains at one station

Show all N, Q, R trains at one stop:

```javascript
config: {
  routeIds: ["N", "Q", "R"],
  stopIds: "D43S",
  updateInterval: 30000
}
```

### Example 3: Cross-line monitoring

Monitor different train lines (automatically fetches multiple feeds):

```javascript
config: {
  routeIds: ["N", "Q", "A", "C", "L"],  // 3 different feeds auto-fetched
  stopIds: ["D43S", "A42S", "L24S"],
  updateInterval: 30000
}
```

### Example 4: All trains at multiple stops

Show all available trains (no route filter) at specific stops:

```javascript
config: {
  // No routeIds - will fetch all feeds
  stopIds: ["D43S", "R36S"],
  updateInterval: 30000
}
```

### Example 5: Everything from one line

Show all N, Q, R, W trains at all stops:

```javascript
config: {
  routeIds: ["N", "Q", "R", "W"],
  // No stopIds - shows all stops
  updateInterval: 30000
}
```

## Available Routes

**Valid routeIds:**
- Letters: A, B, C, D, E, F, G, J, L, M, N, Q, R, S, W, Z
- Numbers: 1, 2, 3, 4, 5, 6, 7
- Special: SR (Rockaway Shuttle), SF (Franklin Avenue Shuttle), SIR (Staten Island Railway)

**Case insensitive** - "n", "N", "Q", "q" all work the same.

## Display Format

The module displays arrivals with human-readable station names:

```
N train, 2 minutes, 45 St (R39N)
Q train, 5 minutes, 45 St (R39S)
R train, 11 minutes, Times Sq-42 St (R16N)
Last Updated: 7:23 PM
```

Each line shows:
- **Route ID** - The train line (N, Q, R, etc.)
- **Time** - Minutes until arrival ("Now", "1 minute", "X minutes")
- **Stop Name** - Human-readable station name
- **Stop ID** - GTFS stop identifier in parentheses

## Finding Stop IDs

To find valid stop IDs for your configuration:

1. Check the `stops.txt` file in the module directory
2. Each stop has a format like: `R39N` (Northbound) or `R39S` (Southbound)
3. Look for your station name and note the stop_id

Example from stops.txt:
```csv
stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station
R39,45 St,40.648939,-74.010006,1,
R39N,45 St,40.648939,-74.010006,,R39
R39S,45 St,40.648939,-74.010006,,R39
```

Use `R39N` for northbound trains at 45 St, or `R39S` for southbound.

