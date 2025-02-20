require('dotenv').config();
const express = require('express')
const cors = require('cors')
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


// middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200,
  }
app.use(cors(corsOptions))
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.khcvy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


async function run() {
try {

    const db = client.db("TODO-DB")
    const userCollections = db.collection("Users")
    const taskCollections = db.collection("Tasks")


    



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
} finally {
    // Ensures that the client will close when you finish/error
}
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Welcome to the TODO app backend')
  })
  
app.listen(port, () => {
    console.log(`TODO App listening on port ${port}`)
})