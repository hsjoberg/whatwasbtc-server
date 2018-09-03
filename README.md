# What was BTC server

## About
What was BTC is a simple service that retrieves the Bitcoin price of a given date.  
It gets the price from a provider (currently Coindesk API) and caches it locally in a sqlite database.

This project contains the HTTP API server part that is supposed to work together with [whatwasbtc-client](https://github.com/hsjoberg/whatwasbtc-client).  
The server is completely decoupled from any specific front-end however.

By design, currently only works with USD.

## Requirements
* NodeJS 8+

## Setup
* Compile and build [whatwasbtc-client](https://github.com/hsjoberg/whatwasbtc-client). Put it in the `public` folder
* `npm install`
* `npm run create-db`

## Run
* `npm start`

## HTTP Requests
* `/*` any static file in the public folder
* `/api/price` gets the current day price
* `/api/price/<ISO-8601 date>` gets the price of a specific date

## Contributing
`npm test` to run the tests.  
PRs are welcome. ☺️

## License
MIT
