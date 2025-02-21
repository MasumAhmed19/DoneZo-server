require('dotenv').config();
const express = require('express')
const cors = require('cors')
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


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

    // API: post user data
    app.post('/add-users', async (req, res)=>{
        const userData = req.body;

        // check if the data already in user DB
        const query = {email: userData.email};
        const isExists = await userCollections.findOne(query);

        if(isExists){
            return res.status(409).json({message: "Data already ache! save korar dorkar nai."})
        }else{
            const result = await userCollections.insertOne(userData);
            res.send(result);
        }
    })

    
    // API: fetch user data through email
    app.get('/user/:email', async (req, res)=>{
        const email = req.params.email;
        const query = {email:email};
        const result = await userCollections.findOne(query)
        res.send(result)
    })

    // API: post a task
    app.post('/tasks', async (req, res)=>{
        const taskData = req.body;
        const result = await taskCollections.insertOne(taskData);
        res.send(result);
    })

    // API: get task data user email
    app.get('/tasks/:email', async (req, res)=>{
        const email = req.params.email;
        const query = {email:email};
        const {category} = req.query;

        if(category){
            query.category = category ;
        }

        const result = await taskCollections.find(query).sort({taskTime:-1}).toArray();
        res.send(result);
    })


    // API: Delete task data with their _id
    app.delete('/task/:id', async (req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await taskCollections.deleteOne(query);
        res.send(result);
    })


    // API: update(put) task 




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
} finally {
    // Ensures that the client will close when you finish/error
}
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Welcome to the DoneZo TODO app backend')
  })
  
app.listen(port, () => {
    console.log(`TODO App listening on port ${port}`)
})