const express = require('express');
const cors = require('cors');
require('dotenv').config();

const jwt = require ('jsonwebtoken');
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

function verifyJWT(req, res, next){
    
    //console.log('TOken inside',req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err , decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded; 
        next();
    })
}


async function run(){
    try{
        const phoneCollection = client.db('usedPhone').collection('phoneCollections');
        const tabCollection = client.db('usedPhone').collection('tabCollections');
        const smartWatchCollection = client.db('usedPhone').collection('watchCollections');

        //Booking Collection
        const bookingCollection = client.db('usedPhone').collection('bookings');
        
        /* Tablet Booking Collection
        const tabBookingCollection = client.db('usedPhone').collection('tabBookings'); 
        Watch Booking Collection
        const watchBookingCollection = client.db('usedPhone').collection('watchBookings');
         */
        
        //Users Collection
        const emailUserCollection = client.db('usedPhone').collection('emailusers');
        /* const socialUserCollection = client.db('usedPhone').collection('socialusers');*/

        const complainCollection = client.db('usedPhone').collection('complains');
        


        //Admin verify section
        const verifyAdmin = async(req, res, next) =>{
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await emailUserCollection.findOne(query);

            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }





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

        app.post('/phoneCollections', async(req, res) =>{
            const addPhone = req.body;
            const result = await phoneCollection.insertOne(addPhone);
            res.send(result);
        })

        app.get('/phoneCollections/:id', async (req, res) =>{
            const id = req.params.id;
            const query = {  _id : new ObjectId(id) }
            
            const singlePhoneCollection = await phoneCollection.findOne(query);
            res.send(singlePhoneCollection);
        })
        

        //booking collection section

        app.get('/booking',verifyJWT, async(req, res)=>{
            const email = req.query.email;
            
           // console.log('token',req.headers.authorization);

            const decodedEmail = req.query.email;
            if(email !==decodedEmail){
                return res.status(403).send('Forbidden access.');
            }
            const query ={email : email};
            
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

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
           const tabAlreadyBooked = await bookingCollection.find(tabBookingQuery).toArray();
           
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

        


        //watch Collection section
        app.get('/watchCollections', async (req, res) =>{
            const date = req.query.date;
            const query = {};
            const watches= await smartWatchCollection.find(query).toArray();

            //already provided date to match up the selected date

            const watchBookingQuery = { appointmentDate: date };
            const watchAlreadyBooked = await bookingCollection.find(watchBookingQuery).toArray();

            //looping for the slot available or not
            watches.forEach(watch =>{
                const watchBooked = watchAlreadyBooked.filter(book => book.device === watch.name);
                const watchBookedSlots = watchBooked.map(book => book.slot);
                const remainingSLots = watch.slots.filter(slot => !watchBookedSlots.includes(slot));
                watch.slots = remainingSLots;
                //console.log(date,watch.name,watchBookedSlots);
            })

            res.send(watches);
        });

        app.post('/watchCollections', async( req, res) =>{
            const query = req.body;
            const result = await smartWatchCollection.insertOne(query);
            res.send(result); 
        })

        app.get('/watchCollections/:id', async(req, res) =>{
            const id = req.params.id;
            const query = { _id : new ObjectId(id) };
            const result = await smartWatchCollection.findOne(query);
            res.send(result);
        })

        

        //store users email
        app.get('/emailusers', async(req,res) =>{
            const query = {};
            const result = await emailUserCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/emailusers', async(req, res) =>{
            const emailUsers = req.body;
            const result = await emailUserCollection.insertOne(emailUsers);
            res.send(result);
        });

        app.get('/emailusers/admin/:email' , async(req, res) =>{
            const email = req.params.email;
            const query = { email}
            const user = await emailUserCollection.findOne(query);
            res.send({isAdmin:  user?.role === 'admin'})
        })

        app.put('/emailusers/admin/:id',verifyJWT, async(req, res) =>{
            const decodedEmail = req.decoded.email;
            const query = {email : decodedEmail}
            const user = await emailUserCollection.findOne(query);
            if(user?.role !== 'admin')
            {
                return res.status(403).send({message: 'forbidden access'})
            }


            const id = req.params.id;
            const filter = { _id : new ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc ={
                $set: {
                    role: 'admin'
                }
            }
            const result = await emailUserCollection.updateOne(filter,updatedDoc,options);
            res.send(result);
            
        })


        app.delete('/emailusers/:id', async(req, res) =>{
            const id = req.params.id;
            //console.log(id)
            const query = {_id : new ObjectId(id)};
            const result = await emailUserCollection.deleteOne(query);
            res.send(result);
        })

        //JASONWEBTOKEN
        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email : email};
            const user = await emailUserCollection.findOne(query);
            if(user)
            {
                const token = jwt.sign({email},process.env.ACCESS_TOKEN, {expiresIn: '365d'});
                return res.send({accessToken: token})
            }
            //console.log('users info',user)
            res.status(403).send({accessToken: 'jwt'});
        });

        //Reported Collection

        app.get('/complains', async(req, res) =>{
            const query = {};
            const result = await complainCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/complains', async(req, res) =>{
            const report = req.body;
            const result = await complainCollection.insertOne(report);
            res.send(result);
        });
        app.delete('/complains/:id' , async(req, res) =>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await complainCollection.deleteOne(query);
            //console.log(result);
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