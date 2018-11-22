# Sync Youtube

**This is an early development Synced Youtube web app.**

*I used Socket.io as web socket for TCP connection between server and client*

It basicly let you to watch youtube videos synced with the people who is on the
website. There is play and pause buttons and progress bar which synced with everyone.

As addition, I added a little chatbox which takes your username when the page loads.

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku CLI](https://cli.heroku.com/) installed.

```sh
$ git clone https://github.com/mrcn04/Sync-Youtube.git
$ cd Sync-Youtube
$ npm install
$ npm start or node app.js
```

Your app should now be running on [localhost:4000](http://localhost:4000/).

## Deploying to Heroku

```
$ heroku create
$ git push heroku master
$ heroku open
```

or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


### Documentation

- [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)