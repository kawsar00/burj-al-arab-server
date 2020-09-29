const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient;
const { query } = require('express')
const admin = require('firebase-admin');
require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ggbl3.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000

const app = express()
app.use(cors())
app.use(bodyParser.json())

console.log(process.env.DB_PASS);

var serviceAccount = require("./config/burj-al-arab-site-firebase-adminsdk-1wqac-a7aacc52f6.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
  
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {
  const bookingCollection = client.db("burjAlArab").collection("bookings");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookingCollection.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/Bookings', (req, res) => {
    // console.log(req.query.email)
    // console.log(req.headers.authorization)
    const bearer = req.headers.authorization
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1]

      admin.auth().verifyIdToken(idToken)
      .then(function (decodedToken) {
        const tokenEmail = decodedToken.email;
        const queryEmail = req.query.email;

        if (tokenEmail == queryEmail) {
          bookingCollection.find({ email: queryEmail })
          .toArray((err, documents) => {
            res.send(documents)
          })
        }
        else{
          res.status(401).send('unauthorized access')
        }
      })

      .catch(function (error) {
        res.status(401).send('unauthorized access')
      });

    }
    else{
      res.status(401).send('unauthorized access')
    }
  })
});


app.listen(port)