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
  start: function () {
    var self = this
    this.dataRequest = null
    this.loaded = false
    this.stopNames = {} // Store stop names mapping

    console.log("Starting module: " + this.name)
    this.sendSocketNotification("CONFIG", this.config)

    // Schedule update timer
    setInterval(function () {
      self.sendSocketNotification("FETCH_DATA")
    }, this.config.updateInterval)
  },

  /**
   * Apply the default styles.
   */
  getStyles: function () {
    return ["MMM-MTA-NextSubway.css"]
  },

  /**
   * Get required scripts
   */
  getScripts: function () {
    return ["moment.js"]
  },

  /**
   * Render the subway arrivals.
   */
  getDom: function () {
    var wrapper = document.createElement("div")

    // If we have data to display
    if (this.dataRequest) {
      this.dataRequest.forEach(function (data) {
        var wrapperDataRequest = document.createElement("div")
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
  processData: function (data) {
    var self = this
    // Store stop names if provided
    if (data.stopNames) {
      this.stopNames = data.stopNames
    }
    this.dataRequest = self.processSubwayArrivals(data)
    self.updateDom(self.config.animationSpeed)
    this.loaded = true
  },

  /**
   * Process subway arrivals from GTFS feed
   */
  processSubwayArrivals: function (response) {
    var result = []
    var now = Math.floor(Date.now() / 1000) // Current time in Unix timestamp

    if (!response.feed || !response.feed.entity) {
      result.push("No subway data available")
      return result
    }

    var entities = response.feed.entity
    var arrivals = []
    var configuredStopIds = this.config.stopIds

    // Convert stopIds to array if it's a single value
    var stopIdsArray = configuredStopIds ? (Array.isArray(configuredStopIds) ? configuredStopIds : [configuredStopIds]) : null

    console.log("[MMM-MTA-NextSubway] Filtering for stops:", stopIdsArray)

    // Extract arrivals from entities
    entities.forEach(function (entity) {
      if (entity.tripUpdate && entity.tripUpdate.stopTimeUpdate) {
        var trip = entity.tripUpdate.trip
        var routeId = trip.routeId

        entity.tripUpdate.stopTimeUpdate.forEach(function (stopTime) {
          // Only process stops that match our configured stopIds (if specified)
          if (!stopIdsArray || stopIdsArray.includes(stopTime.stopId)) {
            var arrivalTime = stopTime.arrival ? stopTime.arrival.time : null
            var departureTime = stopTime.departure ? stopTime.departure.time : null
            var timeToUse = arrivalTime || departureTime

            if (timeToUse) {
              arrivals.push({
                routeId: routeId,
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
    arrivals.sort(function (a, b) {
      return a.arrivalTime - b.arrivalTime
    })

    console.log("[MMM-MTA-NextSubway] Found " + arrivals.length + " arrivals matching configured stops")

    // Limit to maxEntries
    var displayCount = Math.min(arrivals.length, this.config.maxEntries)

    for (var i = 0; i < displayCount; i++) {
      var arrival = arrivals[i]
      var mins = Math.floor((arrival.arrivalTime - now) / 60)
      var timeStr = ""

      if (mins <= 0) {
        timeStr = "Now"
      } else if (mins === 1) {
        timeStr = "1 minute"
      } else {
        timeStr = mins + " minutes"
      }

      // Get stop name from stopNames mapping
      var stopName = this.stopNames[arrival.stopId] || arrival.stopId
      var line = arrival.routeId + " train, " + timeStr + ", " + stopName + " (" + arrival.stopId + ")"
      result.push(i===0 ? `<span class='bright bold'>${line}</span>` : line)
    }

    if (arrivals.length === 0) {
      result.push("No upcoming trains")
    }

    // Add last updated time
    var updateTime = new Date()
    result.push("Last Updated: " + this.formatTimeString(updateTime))

    return result
  },

  /**
   * Format time string based on config
   */
  formatTimeString: function (date) {
    var m = moment(date)

    var hourSymbol = "HH"
    var periodSymbol = ""

    if (this.config.timeFormat !== 24) {
      hourSymbol = "h"
      periodSymbol = " A"
    }

    var format = hourSymbol + ":mm" + periodSymbol

    return m.format(format)
  },

  /**
   * Handle notifications received by the node helper.
   */
  socketNotificationReceived: function (notification, payload) {
    if (notification === "FETCH_MTA_REALTIME_FEED_SUCCESS") {
      this.processData(payload)
    } else if (notification === "FETCH_MTA_REALTIME_FEED_ERROR") {
      console.error("Error fetching MTA data:", payload.error)
      this.dataRequest = ["Error loading subway data"]
      this.updateDom(this.config.animationSpeed)
    }
  }
})
