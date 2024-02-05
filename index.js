const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb')
const morgan = require('morgan')
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
      origin: ['http://localhost:5173', 'https://happy_users.web.app'],
      credentials: true,
      optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(morgan('dev'))

const client = new MongoClient(process.env.DB_URI, {
      serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
      },
})
async function run() {
      try {
            const usersCollection = client.db("HappyUsersDB").collection("users");

            // Save or modify user email, status in DB
            app.put('/users/:email', async (req, res) => {
                  const email = req.params.email
                  const user = req.body
                  const query = { email: email }
                  const options = { upsert: true }
                  const isExist = await usersCollection.findOne(query)
                  console.log('User found?----->', isExist)
                  if (isExist) return res.send(isExist)
                  const result = await usersCollection.updateOne(
                        query,
                        {
                              $set: { ...user, timestamp: Date.now() },
                        },
                        options
                  )
                  res.send(result)
            })

            app.post('/api/v1/users', async (req, res) => {
                  const user = req.body;

                  const result = await usersCollection.insertOne(user)
                  res.send(result)
            })

            // Send a ping to confirm a successful connection
            await client.db('admin').command({ ping: 1 })
            console.log(
                  'Pinged your deployment. You successfully connected to MongoDB!'
            )
      } finally {
            // Ensures that the client will close when you finish/error
            // await client.close();
      }
}
run().catch(console.dir)

app.get('/', (req, res) => {
      res.send('Hello from Happy Users Server..')
})

app.listen(port, () => {
      console.log(`Happy Users is running on port ${port}`)
})