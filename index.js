const express = require('express');
const jwt = require('jsonwebtoken')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
console.log(process.env.DB_USER);








const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rqq4klv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const tourCollection = client.db('tour-guided').collection('tours')
        const guidesCollection = client.db('tour-guided').collection('guides')
        const bookingCollection = client.db('tour-guided').collection('bookings')
        const wishCollection = client.db('tour-guided').collection('wish')
        const storyCollection = client.db('tour-guided').collection('story')
        const userCollection = client.db('tour-guided').collection('users')



        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })


        const verifytoken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.SECRET_TOKEN, (error, decoded) => {
                if (error) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                req.decoded = decoded
                next()
            })

        }

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded?.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const isAdmin = user?.role === 'admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }
        const verifyGuide = async (req, res, next) => {
            const email = req.decoded?.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const istourGuide = user?.role === 'tour guide'
            if (!istourGuide) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }

        //  user related api
        app.get('/users', verifytoken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        app.get('/users/admin/:email', verifytoken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'unauthorized access' })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let admin = false
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin })
        })
        app.get('/users/tourguide/:email', verifytoken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'unauthorized access' })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let tourGuide = false
            if (user) {
                tourGuide = user?.role === 'tour guide'
            }
            res.send({ tourGuide })
        })

        app.post('/users', async (req, res) => {
            const users = req.body
            const query = { email: users.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already in', insertedId: null })
            }
            const result = await userCollection.insertOne(users)
            res.send(result)
        })
        app.patch('/users/admin/:id', verifytoken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updatedRole = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await userCollection.updateOne(filter, updatedRole)
            res.send(result)
        })

        app.patch('/users/tourguide/:id', verifytoken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updatedRole = {
                $set: {
                    role: 'tour guide'
                }
            };
            const result = await userCollection.updateOne(filter, updatedRole)
            res.send(result)
        })
        app.delete('/users/:id', verifytoken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        // tours related api
        app.get('/tours', async (req, res) => {

            const result = await tourCollection.find().toArray()
            res.send(result)
        })
        app.post('/tours', async (req, res) => {
            const tours = req.body
            const result = await tourCollection.insertOne(tours)
            res.send(result)
        })


        // guides related api
        app.get('/guides', async (req, res) => {
            const result = await guidesCollection.find().toArray()
            res.send(result)
        })
        app.post('/guides', async (req, res) => {
            const guides = req.body
            const result = await guidesCollection.insertOne(guides)
            res.send(result)
        })




        app.get('/admin-profile', async (req, res) => {
            const tours = await tourCollection.estimatedDocumentCount()
            const guides = await guidesCollection.estimatedDocumentCount()
            const users = await userCollection.estimatedDocumentCount()

            res.send({ tours, guides, users })
        })

        app.get('/bookings', async (req, res) => {
            const guideName = req.query.guideName;
            const email = req.query.email;
            const query = {};
          
            if (guideName) {
              query.guideName = guideName;
            }
          
            if (email) {
              query.email = email;
            }
          
            // Perform the query based on guideName, email, or both
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
          });




        app.post('/bookings', async (req, res) => {
            const user = req.body;
            const result = await bookingCollection.insertOne(user)
            res.send(result)
        })


        app.get('/wishlist', verifytoken, async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await wishCollection.find(query).toArray()
            res.send(result)

        })
        app.post('/wishlist', async (req, res) => {
            const user = req.body
            const result = await wishCollection.insertOne(user)
            res.send(result)
        })


        //story related api

        app.get('/story', async (req, res) => {
            const result = await storyCollection.find().toArray()
            res.send(result)
        })
        app.post('/story', async (req, res) => {
            const story = req.body
            const result = await storyCollection.insertOne(story)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('my tour guided project is running')
})

app.listen(port, () => {
    console.log(`my project is running at port ${port}`);
})
