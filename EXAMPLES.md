# Configuration Examples for MMM-MTA-NextSubway

## Example 1: Single Train, Single Stop (Simplest)
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: "N",
    stopIds: "D43S",
    updateInterval: 30000
  }
}
```
**Result:** Only N train arrivals at stop D43S. Fetches NQRW feed only.

---

## Example 2: Multiple Trains, Same Line
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: ["N", "Q", "R"],
    stopIds: "D43S",
    updateInterval: 30000
  }
}
```
**Result:** N, Q, and R train arrivals at stop D43S. Fetches NQRW feed only.

---

## Example 3: Cross-Line (Automatic Multi-Feed)
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: ["N", "A", "L"],
    stopIds: ["D43S", "A42S", "L24S"],
    updateInterval: 30000
  }
}
```
**Result:** N, A, and L trains at their respective stops. Automatically fetches 3 feeds (NQRW, ACE, L).

---

## Example 4: All Trains at One Stop
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: ["N", "Q", "R", "W"],  // All trains that stop here
    stopIds: "D43S",
    updateInterval: 30000
  }
}
```
**Result:** All NQRW trains at stop D43S. Fetches NQRW feed only.

---

## Example 5: One Train, Multiple Stops
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: "Q",
    stopIds: ["D43S", "R36S", "R31S"],  // Multiple stations
    updateInterval: 30000
  }
}
```
**Result:** Q train arrivals at three different stops. Fetches NQRW feed only.

---

## Example 6: All Trains at Multiple Stops (No Route Filter)
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    stopIds: ["D43S", "R36S"],  // Show any train at these stops
    updateInterval: 30000
  }
}
```
**Result:** All trains arriving at D43S or R36S. Fetches ALL 8 feeds (entire system).

---

## Example 7: Manhattan Local Lines
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: ["1", "2", "3", "A", "C", "E"],
    stopIds: "A27S",  // Times Square area
    updateInterval: 30000
  }
}
```
**Result:** Local trains at Times Square. Fetches 2 feeds (1234567, ACE).

---

## Example 8: Express Trains Only
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: ["4", "5", "D"],
    stopIds: ["635S", "D19S"],
    updateInterval: 30000
  }
}
```
**Result:** Express trains at specific stops. Fetches 2 feeds (1234567, BDFM).

---

## Example 9: Complete Station Monitor (All Platforms)
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    routeIds: ["N", "Q", "R", "W", "B", "D", "F", "M"],
    stopIds: ["D43N", "D43S", "R36N", "R36S"],  // Both directions, multiple stops
    updateInterval: 30000
  }
}
```
**Result:** All trains at Herald Square complex. Fetches 2 feeds (NQRW, BDFM).

---

## Example 10: Manual Override (Advanced)
```javascript
{
  module: "MMM-MTA-NextSubway",
  position: "top_left",
  config: {
    feedUrls: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
    routeIds: ["N", "Q"],  // Still filtered even with manual URL
    updateInterval: 30000
  }
}
```
**Result:** N and Q trains from manually specified feed. Overrides auto-detection.

---

## Stop ID Format

Stop IDs typically follow this pattern:
- `D43S` = Stop D43, Southbound
- `D43N` = Stop D43, Northbound
- `R36S` = Stop R36, Southbound
- etc.

You can find stop IDs in the GTFS feed data or MTA documentation.

---

## Update Interval Guidelines

- **30000** (30 seconds) - Recommended for active monitoring
- **60000** (60 seconds) - Good balance between updates and API load
- **120000** (2 minutes) - Lighter load, less frequent updates
- **300000** (5 minutes) - Minimal load, occasional checks

---

## Performance Notes

- **1 route from 1 feed**: Very fast, minimal data
- **Multiple routes from 1 feed**: Fast, single fetch
- **Routes from 2-3 feeds**: Still fast, parallel fetching
- **Routes from 4+ feeds**: Slightly slower, but still efficient
- **No route filter**: Slowest, fetches all 8 feeds (entire system)

**Recommendation:** Always specify routeIds for best performance!

