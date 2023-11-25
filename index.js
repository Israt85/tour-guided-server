const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
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


    // tours related api
    app.get('/tours', async(req,res)=>{
       
        const result = await tourCollection.find().toArray()
        res.send(result)
    })
    // app.get('/tours/:id', async(req,res)=>{
    //     const id = req.params.id;
    //       const query = {_id: new ObjectId(id)}
    //       const result = await tourCollection.findOne(query);
    //       res.send(result)
    // })


    // guides related api
    app.get('/guides', async(req,res)=>{
        const result = await guidesCollection.find().toArray()
        res.send(result)
    })

    app.post('/guides', async(req,res)=>{
        const user = req.body;
        const result = await guidesCollection.insertOne(user)
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



app.get('/', (req,res)=>{
    res.send('my tour guided project is running')
})

app.listen(port, ()=>{
    console.log(`my project is running at port ${port}`);
})
