/* global config, moment */

/* Magic Mirror
 * Module: MMM-MTA-NextSubway
 *
 * MIT Licensed.
 */

Module.register("MMM-MTA-NextSubway", {

  defaults: {
    timeFormat: config.timeFormat,
    maxEntries: 5,
    updateInterval: 60000,
    retryDelay: 5000
  },

  requiresVersion: "2.1.0",

  /**
   * Pseudo-constructor for our module. Initialize stuff here.
   */
  start() {
    this.dataRequest = null
    this.loaded = false
    this.stopNames = {} // Store stop names mapping

    console.log(`Starting module: ${this.name}`)
    this.sendSocketNotification("CONFIG", this.config)

    // Schedule update timer
    setInterval(() => {
      this.sendSocketNotification("FETCH_DATA")
    }, this.config.updateInterval)
  },

  /**
   * Apply the default styles.
   */
  getStyles() {
    return ["MMM-MTA-NextSubway.css"]
  },

  /**
   * Get required scripts
   */
  getScripts() {
    return ["moment.js"]
  },

  /**
   * Render the subway arrivals.
   */
  getDom() {
    const wrapper = document.createElement("div")

    // If we have data to display
    if (this.dataRequest) {
      this.dataRequest.forEach((data) => {
        const wrapperDataRequest = document.createElement("div")
        wrapperDataRequest.innerHTML = data
        wrapperDataRequest.className = "small"
        wrapper.appendChild(wrapperDataRequest)
      })
    } else {
      // Loading state
      wrapper.innerHTML = "Loading subway arrivals..."
      wrapper.className = "small dimmed"
    }

    return wrapper
  },

  /**
   * Process the subway feed data
   */
  processData(data) {
    // Store stop names if provided
    if (data.stopNames) {
      this.stopNames = data.stopNames
    }
    this.dataRequest = this.processSubwayArrivals(data)
    this.updateDom(this.config.animationSpeed)
    this.loaded = true
  },

  /**
   * Process subway arrivals from GTFS feed
   */
  processSubwayArrivals(response) {
    const result = []
    const now = Math.floor(Date.now() / 1000) // Current time in Unix timestamp

    if (!response.feed || !response.feed.entity) {
      result.push("No subway data available")
      return result
    }

    const entities = response.feed.entity
    const arrivals = []
    const configuredStopIds = this.config.stopIds

    // Convert stopIds to array if it's a single value
    const stopIdsArray = configuredStopIds ? (Array.isArray(configuredStopIds) ? configuredStopIds : [configuredStopIds]) : null

    console.log("[MMM-MTA-NextSubway] Filtering for stops:", stopIdsArray)

    // Extract arrivals from entities
    entities.forEach((entity) => {
      if (entity.tripUpdate && entity.tripUpdate.stopTimeUpdate) {
        const { trip } = entity.tripUpdate
        const { routeId } = trip

        entity.tripUpdate.stopTimeUpdate.forEach((stopTime) => {
          // Only process stops that match our configured stopIds (if specified)
          if (!stopIdsArray || stopIdsArray.includes(stopTime.stopId)) {
            const arrivalTime = stopTime.arrival?.time ?? null
            const departureTime = stopTime.departure?.time ?? null
            const timeToUse = arrivalTime || departureTime

            if (timeToUse) {
              arrivals.push({
                routeId,
                stopId: stopTime.stopId,
                arrivalTime: parseInt(timeToUse),
                tripId: trip.tripId
              })
            }
          }
        })
      }
    })

    // Sort by arrival time
    arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime)

    console.log(`[MMM-MTA-NextSubway] Found ${arrivals.length} arrivals matching configured stops`)

    // Limit to maxEntries
    const displayCount = Math.min(arrivals.length, this.config.maxEntries)
    const seenStopIds = {} // Track first occurrence of each stopId

    for (let i = 0; i < displayCount; i++) {
      const arrival = arrivals[i]
      const mins = Math.floor((arrival.arrivalTime - now) / 60)
      let timeStr = ""

      if (mins <= 0) {
        timeStr = "Now"
      } else if (mins === 1) {
        timeStr = "1 minute"
      } else {
        timeStr = `${mins} minutes`
      }

      // Get stop name from stopNames mapping
      const stopName = this.stopNames[arrival.stopId] || arrival.stopId
      const line = `${arrival.routeId} train, ${timeStr}, ${stopName} (${arrival.stopId})`

      // Apply bright bold to first occurrence of each stopId
      const isFirstForStop = !seenStopIds[arrival.stopId]
      seenStopIds[arrival.stopId] = true

      result.push(isFirstForStop ? `<span class='bright bold'>${line}</span>` : line)
    }

    if (arrivals.length === 0) {
      result.push("No upcoming trains")
    }

    // Add last updated time
    const updateTime = new Date()
    result.push(`Last Updated: ${this.formatTimeString(updateTime)}`)

    return result
  },

  /**
   * Format time string based on config
   */
  formatTimeString(date) {
    const m = moment(date)

    let hourSymbol = "HH"
    let periodSymbol = ""

    if (this.config.timeFormat !== 24) {
      hourSymbol = "h"
      periodSymbol = " A"
    }

    const format = `${hourSymbol}:mm${periodSymbol}`

    return m.format(format)
  },

  /**
   * Handle notifications received by the node helper.
   */
  socketNotificationReceived(notification, payload) {
    if (notification === "FETCH_MTA_REALTIME_FEED_SUCCESS") {
      this.processData(payload)
    } else if (notification === "FETCH_MTA_REALTIME_FEED_ERROR") {
      console.error("Error fetching MTA data:", payload.error)
      this.dataRequest = ["Error loading subway data"]
      this.updateDom(this.config.animationSpeed)
    }
  }
})
