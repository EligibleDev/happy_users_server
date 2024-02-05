const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const morgan = require('morgan')
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'https://happy_users.web.app'],
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
            const teammatesCollection = client.db("HappyUsersDB").collection("teammates");

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

            app.post('/api/v1/teammates', async (req, res) => {
                  const teammate = req.body;

                  const result = await teammatesCollection.insertOne(teammate);
                  res.send(result)
            })

            app.get('/api/v1/teammates/:email', async (req, res) => {
                  const leaderEmail = req.params.email
                  const query = { active: true, leader: leaderEmail }
                  const sort = JSON.parse(req.query.sort)
                  console.log(sort)

                  const cursor = teammatesCollection.find(query)
                  const result = await cursor.toArray()

                  // Parse the addedTime strings into Date objects

                  if (sort) {
                        // result.forEach(item => {
                        //       item.addedTime = new Date(item.addedTime);
                        // });

                        // // Sort the array based on the parsed Date objects
                        // const sorted = result.sort((a, b) => a.addedTime - b.addedTime);
                        const sorted = result.reverse();
                        return res.send(sorted)
                  } else {
                        res.send(result)
                  }
            })



            app.patch('/api/v1/make_inactive/:_id', async (req, res) => {
                  const _id = req.params._id;
                  const query = { _id: new ObjectId(_id) };
                  const options = { upsert: true }

                  const teammate = {
                        $set: {
                              active: false,
                        }
                  }

                  const result = await teammatesCollection.updateOne(query, teammate, options);
                  res.send(result)
            })

            app.delete('/api/v1/delete_teammate/:_id', async (req, res) => {
                  const _id = req.params._id;
                  const query = { _id: new ObjectId(_id) }

                  const result = await teammatesCollection.deleteOne(query);
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