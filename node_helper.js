const NodeHelper = require("node_helper")
const GtfsRealtimeBindings = require("gtfs-realtime-bindings")
const MTA_STOPS = require("./stops-data.js")

// MTA GTFS Feed URL Constants
const FEED_URL_ACE = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace"
const FEED_URL_BDFM = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm"
const FEED_URL_G = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g"
const FEED_URL_JZ = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz"
const FEED_URL_L = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l"
const FEED_URL_NQRW = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw"
const FEED_URL_1234567 = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs"
const FEED_URL_SI = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si"

module.exports = NodeHelper.create({

  // Mapping of route IDs to their feed URLs
  ROUTE_TO_FEED_MAP: {
    A: FEED_URL_ACE,
    C: FEED_URL_ACE,
    E: FEED_URL_ACE,
    SR: FEED_URL_ACE,
    G: FEED_URL_G,
    N: FEED_URL_NQRW,
    Q: FEED_URL_NQRW,
    R: FEED_URL_NQRW,
    W: FEED_URL_NQRW,
    1: FEED_URL_1234567,
    2: FEED_URL_1234567,
    3: FEED_URL_1234567,
    4: FEED_URL_1234567,
    5: FEED_URL_1234567,
    6: FEED_URL_1234567,
    7: FEED_URL_1234567,
    S: FEED_URL_1234567,
    B: FEED_URL_BDFM,
    D: FEED_URL_BDFM,
    F: FEED_URL_BDFM,
    M: FEED_URL_BDFM,
    SF: FEED_URL_BDFM,
    J: FEED_URL_JZ,
    Z: FEED_URL_JZ,
    L: FEED_URL_L,
    SIR: FEED_URL_SI
  },

  async socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload
      this.fetchMtaRealtimeFeed()

      const self = this
      setInterval(function () {
        self.fetchMtaRealtimeFeed()
      }, self.config.updateInterval)
    } else if (notification === "FETCH_DATA") {
      this.fetchMtaRealtimeFeed()
    }
  },

  filterFeed(entities, routeIds, stopIds) {
    // Convert single values to arrays for consistent handling
    const routes = routeIds ? (Array.isArray(routeIds) ? routeIds : [routeIds]) : null
    const stops = stopIds ? (Array.isArray(stopIds) ? stopIds : [stopIds]) : null

    return entities.filter((entity) => {
      // Check if entity has a tripUpdate
      if (!entity.tripUpdate) return false

      // Check if routeId matches (if specified)
      const routeMatch = !routes || routes.includes(entity.tripUpdate.trip?.routeId)

      // Check if any stopTimeUpdate has matching stopId (if specified)
      const stopMatch = !stops || entity.tripUpdate.stopTimeUpdate?.some(
        update => stops.includes(update.stopId)
      )

      return routeMatch && stopMatch
    })
  },

  getFeedUrlsForRoutes(routeIds) {
    // If no routeIds specified, return all feeds
    if (!routeIds || (Array.isArray(routeIds) && routeIds.length === 0)) {
      return [
        FEED_URL_ACE,
        FEED_URL_G,
        FEED_URL_NQRW,
        FEED_URL_1234567,
        FEED_URL_BDFM,
        FEED_URL_JZ,
        FEED_URL_L,
        FEED_URL_SI
      ]
    }

    // Convert single value to array
    const routes = Array.isArray(routeIds) ? routeIds : [routeIds]

    // Get unique feed URLs for the specified routes
    const feedUrls = new Set()
    routes.forEach((routeId) => {
      const normalizedRoute = routeId.toUpperCase()
      const feedUrl = this.ROUTE_TO_FEED_MAP[normalizedRoute]
      if (feedUrl) {
        feedUrls.add(feedUrl)
      } else {
        console.warn(`[MMM-MTA-NextSubway] Unknown route ID: ${routeId}`)
      }
    })

    return Array.from(feedUrls)
  },

  async fetchSingleFeed(url) {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(uint8Array)
  },

  async fetchMtaRealtimeFeed() {
    try {
      let urls = []

      // Priority 1: Manual feedUrls override (for custom configurations)
      if (this.config.feedUrls) {
        urls = Array.isArray(this.config.feedUrls) ? this.config.feedUrls : [this.config.feedUrls]
      } else if (this.config.feedUrl) {
        // Priority 2: Single feedUrl (legacy support)
        urls = [this.config.feedUrl]
      } else if (this.config.routeIds) {
        // Priority 3: Auto-determine from routeIds
        urls = this.getFeedUrlsForRoutes(this.config.routeIds)
      } else {
        // Priority 4: Default to NQRW feed
        urls = [FEED_URL_NQRW]
      }

      if (urls.length === 0) {
        console.error("[MMM-MTA-NextSubway] No feed URLs to fetch")
        return
      }

      // Fetch all feeds in parallel
      const feeds = await Promise.all(urls.map(url => this.fetchSingleFeed(url)))

      // Combine all entities from all feeds
      const allEntities = feeds.flatMap(feed => feed.entity)

      // Filter by routeIds and/or stopIds from config
      const filteredEntities = this.filterFeed(allEntities, this.config.routeIds, this.config.stopIds)

      console.log(`[MMM-MTA-NextSubway] Fetched ${feeds.length} feed(s): ${allEntities.length} entities -> ${filteredEntities.length} filtered`)

      // Build stop names map for only the stops in filtered entities
      const relevantStopNames = {}
      filteredEntities.forEach((entity) => {
        if (entity.tripUpdate && entity.tripUpdate.stopTimeUpdate) {
          entity.tripUpdate.stopTimeUpdate.forEach((stopTime) => {
            if (stopTime.stopId && MTA_STOPS[stopTime.stopId]) {
              relevantStopNames[stopTime.stopId] = MTA_STOPS[stopTime.stopId]
            }
          })
        }
      })

      // Use the header from the first feed
      this.sendSocketNotification("FETCH_MTA_REALTIME_FEED_SUCCESS", {
        feed: {
          header: feeds[0].header,
          entity: filteredEntities
        },
        stopNames: relevantStopNames
      })
    } catch (error) {
      console.error("[MMM-MTA-NextSubway] Error fetching MTA data:", error)
      this.sendSocketNotification("FETCH_MTA_REALTIME_FEED_ERROR", { error: error.message })
    }
  }
})
