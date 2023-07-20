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
        
        //Tablet Booking Collection
        const tabBookingCollection = client.db('usedPhone').collection('tabBookings');
        
        //Users Collection
        const emailUserCollection = client.db('usedPhone').collection('emailusers');
        /* const socialUserCollection = client.db('usedPhone').collection('socialusers');
 */
        

        //Phone collection section
        app.get('/phoneCollections', async(req, res) =>{
            const date = req.query.date;
            const query = {};
            const phones = await phoneCollection.find(query).toArray();
            
            //get the booking date that already provided
            const bookingQuery= { appointmentDate: date };
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray(); 

            //loop through to checkout the slots available
            phones.forEach(phone =>{
                const phoneBooked = alreadyBooked.filter(book =>book.device === phone.name);
                const bookedSlots = phoneBooked.map(book => book.slot );
                const remainingSlots = phone.slots.filter( slot => !bookedSlots.includes(slot));
                phone.slots = remainingSlots;
            })

            res.send(phones);
        });

        app.get('/phoneCollections/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {  _id : new ObjectId(id) }
            
            const singlePhoneCollection = await phoneCollection.findOne(query);
            res.send(singlePhoneCollection);
        })

        //booking collection section
        app.post('/booking', async (req, res) =>{
            const booking = req.body;
            //console.log('inside booking', booking);

            const query ={
                appointmentDate:  booking.appointmentDate,
                email : booking.email,
                device : booking.device
            }

            const alreadyBooked = await bookingCollection.find(query).toArray();
            if(alreadyBooked.length)
            {
                const message = `You already have an booking on ${booking.appointmentDate} `;
                return res.send({acknowledge: false, message});
            }

            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })


        //Tablet collection section
        app.get('/tabCollections', async (req,res) =>{
            const date = req.query.date;
            const query = {};
            const tablets= await tabCollection.find(query).toArray();
          
            //get the provided booking that already provided
           const tabBookingQuery = {appointmentDate: date};
           const tabAlreadyBooked = await tabBookingCollection.find(tabBookingQuery).toArray();
           
           //looping through the slots
           tablets.forEach(tablet => {
            const tabBooked = tabAlreadyBooked.filter(book => book.device === tablet.name);
            const bookedSlots = tabBooked.map(book => book.slot);
            const tabRemainingSlots = tablet.slots.filter(slot => !bookedSlots.includes(slot));
            tablet.slots = tabRemainingSlots;
            //console.log(date,tablet.name,bookedSlots,tabRemainingSlots);
           })
           
            res.send(tablets);
        });


        app.get('/tabCollections/:id', async(req, res) =>{
            const id = req.params.id;
            const query = { _id : new ObjectId(id) };
            const result = await tabCollection.findOne(query);
            res.send(result);
           
            
        })

        app.post('/tabBookings', async (req, res) =>{
            const booking = req.body;

            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                device: booking.device
            }

            const alreadyBooked = await tabBookingCollection.find(query).toArray();
            if(alreadyBooked.length)
            {
                const message = `You have already booked on ${booking.appointmentDate}`;
                return res.send({acknowledge: false, message});
            }


            const result = await tabBookingCollection.insertOne(booking);
            res.send(result);
        })

















        //watch Collection section
        app.get('/watchCollections', async (req, res) =>{
            const query = {};
            const watchCollections = await smartWatchCollection.find(query).toArray();
            res.send(watchCollections);
        })

        

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