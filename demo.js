const shuttle = require('./shuttle')

function readLine() {
  return new Promise(resolve => {
    process.stdout.write('> ')
    process.stdin.resume()
    process.stdin.setEncoding('utf-8')
    process.stdin.once('data', data => {
      process.stdin.pause()
      resolve(data)
    })
  })
}

const tracker = shuttle.createShuttleTracker('http://www.ynhhbus.org/Services/JSONPRelay.svc')

tracker.fetchData().then(async () => {
  // list all the route names
  console.log('Enter the route number:')
  const routes = tracker.getRoutes()
  for (let i = 0; i < routes.length; i++) {
    const num = `${i + 1}.`.padEnd(3)
    const name = routes[i].getName()
    const numVehicles = routes[i].getVehicleIDs().length
    console.log(`  ${num} ${name} (${numVehicles} running)`)
  }
  
  // ask user to select route
  let route
  while (true) {
    let num = await readLine()
    num = parseInt(num)
    
    if (!isNaN(num) && routes.length >= num && num > 0) {
      console.log('Selected route ' + routes[num - 1].getName() + '.')
      route = routes[num - 1]
      break
    } else {
      console.log(`Please enter a number from [1, ${routes.length}]`)
    }
  }
  
  // list all destination names
  console.log('Enter the destination:')
  const stops = route.getRouteStops()
  for (let i = 0; i < stops.length; i++) {
    const num = `${i + 1}.`.padEnd(3)
    console.log(`  ${num} ${stops[i].getName()}`)
  }
  
  // ask user to select destination
  let routestop
  while (true) {
    let num = await readLine()
    num = parseInt(num)
    
    if (!isNaN(num) && stops.length >= num && num > 0) {
      routestop = stops[num - 1]
      break
    } else {
      console.log(`Please enter a number from [1, ${stops.length}]`)
    }
  }
  
  // print estimated arrival times
  const arrivals = routestop.getEstimatedArrivals()
  if (arrivals.length) {
    for (let arrival of arrivals) {
      const arrivalStr = arrival.toLocaleString('en-US', {
        hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
      })
      console.log(`${route.getName()} will arrive at ${routestop.getName()} at ${arrivalStr}.`)
    }
  } else {
    console.log(`${route.getName()} is not running.`)
  }
})
