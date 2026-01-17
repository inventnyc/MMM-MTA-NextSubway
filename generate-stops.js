// Script to convert stops.txt to JavaScript constant
const fs = require("fs")
const path = require("path")

const stopsFile = path.join(__dirname, "stops.txt")
const outputFile = path.join(__dirname, "stops-data.js")

// Read and parse stops.txt
const content = fs.readFileSync(stopsFile, "utf-8")
const lines = content.split("\n")

const stops = {}

// Skip header and empty lines
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue

  const parts = line.split(",")
  const stopId = parts[0]
  const stopName = parts[1]

  // Only include stops with stop_id and stop_name
  if (stopId && stopName) {
    stops[stopId] = stopName
  }
}

// Generate JavaScript file
const output = `/**
 * MTA NYC Subway Stop Data
 * Generated from stops.txt
 *
 * This file contains a mapping of stop IDs to stop names.
 * Each stop ID (e.g., "R39N", "R39S") maps to its human-readable name.
 */

const MTA_STOPS = ${JSON.stringify(stops, null, 2)}

// For use in Node.js modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = MTA_STOPS
}
`

fs.writeFileSync(outputFile, output)
console.log(`Generated ${outputFile} with ${Object.keys(stops).length} stops`)
