const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

//middleware

app.use(cors());
app.use(express.json());



//MongoDB section

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
        const smartWatchCollection = client.db('usedPhone').collection('watchCollections');

        //Booking Collection
        const bookingCollection = client.db('usedPhone').collection('bookings');
        
        //Users Collection
        const emailUserCollection = client.db('usedPhone').collection('emailusers');
        /* const socialUserCollection = client.db('usedPhone').collection('socialusers');
 */
        

        //Phone collection section
        app.get('/phoneCollections', async(req, res) =>{
            const query = {};
            const phones = await phoneCollection.find(query).toArray();
            res.send(phones);
        });

        app.get('/phoneCollections/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {  _id : new ObjectId(id) }
            //console.log(query)
            const singlePhoneCollection = await phoneCollection.findOne(query);
            console.log(singlePhoneCollection);
            res.send(singlePhoneCollection);
        })

        //Tablet collection section
        app.get('/tabCollections', async (req,res) =>{
            const query = {};
            const tabletCollections= await tabCollection.find(query).toArray();
            res.send(tabletCollections);
        });

        //watch Collection section
        app.get('/watchCollections', async (req, res) =>{
            const query = {};
            const watchCollections = await smartWatchCollection.find(query).toArray();
            res.send(watchCollections);
        })

        //booking collection section
        app.post('/bookings', async(req, res) =>{
            const bookings = req.body;
            console.log('inside bookings',bookings);
            const result = await bookingCollection.insertOne(bookings);
            res.send(result);
        });

        //store users email
        app.post('/emailusers', async(req, res) =>{
            const emailUsers = req.body;
            const result = await emailUserCollection.insertOne(emailUsers);
            res.send(result);
        })

        /* app.post('/socialusers', async(req, res) =>{
            const socialUser = req.body;
            const result = await socialUserCollection.insertOne(socialUser);
            res.send(result);
        }) */

        
    }
    finally{

    }
}

run().catch(console.log())



app.get('/', async (req, res) =>{
    res.send('used-phone server is running');
})

app.listen(port, ()=> console.log(`used-phone running on ${port}`));