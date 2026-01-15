# MMM-MTA-NextSubway

*MMM-MTA-NextSubway* is a module for [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) that displays real-time New York City subway arrivals using the MTA's GTFS-Realtime feeds. Track when your train is arriving at your stop with live updates from the official MTA data feeds.

## Features

- **Real-time NYC Subway Arrivals** - Live data from MTA GTFS-Realtime feeds
- **Automatic Feed Detection** - Just specify your train lines (N, Q, R, etc.) and the module automatically fetches the correct feeds
- **Human-Readable Station Names** - Displays "Times Sq-42 St" instead of cryptic stop IDs
- **Multiple Route Support** - Track multiple train lines at once (e.g., N, Q, R, and A trains)
- **Stop Filtering** - Focus on specific stations or stops
- **Stop ID Validation** - Validates configured stops against the MTA's official database of 1,488+ stops
- **Flexible Configuration** - Use single values or arrays for routes and stops

## Screenshot

![Example of MMM-MTA-NextSubway](./example_1.png)

## Installation

### Install

In your terminal, go to the modules directory and clone the repository:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/inventnyc/MMM-MTA-NextSubway.git
cd MMM-MTA-NextSubway
npm install
```

### Update

Go to the module directory and pull the latest changes:

```bash
cd ~/MagicMirror/modules/MMM-MTA-NextSubway
git pull
npm install
```

## Configuration

To use this module, add it to the modules array in the `config/config.js` file.

### Example configuration

Minimal configuration (monitors specific train lines):

```js
{
    module: 'MMM-MTA-NextSubway',
    position: 'top_left',
    config: {
        routeIds: ["N", "Q", "R"]  // Automatically fetches the correct feed
    }
}
```

Configuration with route and stop filtering:

```js
{
    module: 'MMM-MTA-NextSubway',
    position: 'top_left',
    config: {
        routeIds: ["N", "Q", "R"],
        stopIds: ["R39N", "R39S"],  // Only show these stops
        maxEntries: 10,
        updateInterval: 30000  // Update every 30 seconds
    }
}
```

### Configuration options

Option|Possible values|Default|Description
------|------|------|-----------
`routeIds`|`string` or `array`|not set|Train lines to monitor (e.g., "N" or ["N", "Q", "R"]). Module auto-detects correct feeds.
`stopIds`|`string` or `array`|not set|Specific stop IDs to filter (optional). Shows all stops if not specified.
`feedUrls`|`array`|auto-detected|Manual feed URLs (advanced). Only needed if you want to override automatic detection.
`maxEntries`|`number`|`5`|Maximum number of arrivals to display
`updateInterval`|`number` (ms)|`60000`|How often to fetch new data (in milliseconds)
`retryDelay`|`number` (ms)|`5000`|Delay before retrying after an error
`timeFormat`|`number`|`config.timeFormat`|Time format (12 or 24 hour)

**Note:** The module includes validation for stop IDs against the official MTA stops database. Human-readable station names are automatically displayed.

For detailed configuration examples and advanced usage, see [CONFIGURATION.md](CONFIGURATION.md).


## Developer commands

- `npm install` - Install devDependencies like ESLint.
- `node --run lint` - Run linting and formatter checks.
- `node --run lint:fix` - Fix linting and formatter issues.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG.md](CHANGELOG.md) file.
