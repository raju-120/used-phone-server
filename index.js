const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

//middleware

app.use(cors());
app.use(express.json());



//MongoDB section
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DbUSER}:${process.env.DbPASSWORD}@cluster0.iz2d4md.mongodb.net/?retryWrites=true&w=majority`;

//console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run(){
    try{
        const phoneCollection = client.db('usedPhone').collection('phoneCollections');
        const tabCollection = client.db('usedPhone').collection('tabCollections');
        const watchCollection = client.db('usedPhone').collection('watchCollections');


        app.get('/phoneCollections', async(req, res) =>{
            const query = {};
            const phoneCollections = await phoneCollection.find(query).toArray();
            res.send(phoneCollections);
        });

        app.get('/tabCollections', async (req,res) =>{
            const query = {};
            const tabletCollections= await tabCollection.find(query).toArray();
            res.send(tabletCollections);
        });

        app.get('watchCollections', async (req, res) =>{
            const query = {};
            const watchCollections = await watchCollection.find(query).toArray();
            res.send(watchCollections);
        })

    }
    finally{

    }
}

run().catch(console.log())



app.get('/', async (req, res) =>{
    res.send('used-phone server is running');
})

app.listen(port, ()=> console.log(`used-phone running on ${port}`));