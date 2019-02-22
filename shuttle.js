class ShuttleRoute {
  constructor(tracker, routeID) {
    this.tracker = tracker
    this.routeID = routeID
  }
  
  getRouteStopData(addressID) {
    return this.tracker
      .getRouteData(this.routeID)['Stops']
      .find(x => x['AddressID'] == addressID)
  }
  
  getRouteStop(addressID) {
    return new ShuttleRouteStop(this.tracker, this.getRouteStopData(addressID)['RouteStopID'])
  }
  
  getRouteStops() {
    return this.tracker
      .getRouteData(this.routeID)['Stops']
      .map(x => new ShuttleRouteStop(this.tracker, x['RouteStopID']))
  }
  
  getVehicleIDs() {
    return this.tracker
      .getRouteVehiclesData(this.routeID)
      .map(x => x['VehicleID'])
  }
  
  getName() {
    return this.tracker
      .getRouteData(this.routeID)['Description']
  }
}

/**/

function parseDate(str) {
  const matches = /Date\((\d+)([-\+])?(\d+)?\)/.exec(str)
  if (matches) {
    let ts = parseInt(matches[1], 10)
    if (matches[2] && matches[3]) {
      const hours = parseInt(matches[3].substring(0, 2), 10)
    	const minutes = parseInt(matches[3].substring(2, 4), 10)
    	const offset = (hours * 3600 + minutes * 60) * 1000
    	ts = matches[2] == '+' ? ts + offset : ts - offset
    }
    return new Date(ts)
  }
  return null
}

class ShuttleRouteStop {
  constructor(tracker, routeStopID) {
    this.tracker = tracker
    this.routeStopID = routeStopID
  }
  
  getScheduledArrivals() {
    return this.tracker
      .getArrivalData(this.routeStopID)['ScheduledTimes']
      .map(x => parseDate(x['ArrivalTimeUTC']))
  }
  
  getEstimatedArrivals() {
    return this.tracker
      .getArrivalData(this.routeStopID)['VehicleEstimates']
      .map(x => {
        const vehicleData = this.tracker.getVehicleData(x['VehicleID'])
        const now = parseDate(vehicleData['TimeStamp']) || new Date()
        return new Date(now.getTime() + x['SecondsToStop'] * 1000)
      })
  }
  
  getName() {
    return this.tracker
      .getStopData(this.routeStopID)['Description']
  }
}

/**/

const http = require('http')

class ShuttleTracker {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL
    this.apiKey = apiKey
    this.routesForMapData = []
    this.routeStopArrivalsData = []
    this.mapVehiclePointsData = []
  }
  
  async getApiData(method) {
    return new Promise((resolve, reject) => {
      http
        .get(`${this.baseURL}/${method}?ApiKey=${this.apiKey}`, (resp) => {
          let data = ''
          resp.on('data', chunk => data += chunk)
          resp.on('end', () => resolve(JSON.parse(data)))
        })
        .on('error', err => {
          reject(err)
      })
    })
  }
  
  async fetchData() {
    [this.routesForMapData, this.routeStopArrivalsData, this.mapVehiclePointsData] =
      await Promise.all([
        this.getApiData('GetRoutesForMap'),
        this.getApiData('GetRouteStopArrivals'),
        this.getApiData('GetMapVehiclePoints')
      ])
  }
  
  getRoutes() {
    return this.routesForMapData
      .map(x => new ShuttleRoute(this, x['RouteID']))
  }
  
  getRouteData(routeID) {
    return this.routesForMapData
      .find(x => x['RouteID'] == routeID)
  }
  
  getStopData(routeStopID) {
    for (let route of this.routesForMapData) {
      for (let routestop of route['Stops']) {
        if (routestop['RouteStopID'] == routeStopID) {
          return routestop
        }
      }
    }
  }
  
  getArrivalData(routeStopID) {
    return this.routeStopArrivalsData
      .find(x => x['RouteStopID'] == routeStopID)
  }
  
  getRouteVehiclesData(routeID) {
    return this.mapVehiclePointsData
      .filter(x => x['RouteID'] == routeID)
  }
  
  getVehicleData(vehicleID) {
    return this.mapVehiclePointsData
      .find(x => x['VehicleID'] == vehicleID)
  }
}

/**/

module.exports = {
  createShuttleTracker(baseURL, apiKey='8882812681') {
    return new ShuttleTracker(baseURL, apiKey)
  }
}
