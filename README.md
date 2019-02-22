# shuttle-tracker

This script provides a JavaScript implementation of the API for the Ride Systems shuttle tracking service used by many college campuses. For example: http://www.ynhhbus.org/

I had originally developed this to create an Amazon Alexa skill on my personal AWS account. Using the Alexa skills API, you can create prompts that will listen for a route name and destination, and then an AWS Lambda function can use this shuttle API to return the estimated arrival.

To list all of the route names in a bus system, you could do the following:

`const shuttle = require('./shuttle')
const tracker = shuttle.createShuttleTracker('http://www.ynhhbus.org/Services/JSONPRelay.svc')
tracker.fetchData().then(() => {
  const routeNames = tracker.getRoutes().map(x => x.getName())
  console.log(routeNames)
})`

There are more examples in the demo.js file, which you can run with the command `node demo.js`. There are no dependencies other than the built-in http library.
