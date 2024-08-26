const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


// Middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ygq6chl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const userCollection = client.db("jobLinkerDB").collection("users");
        const reviewCollection = client.db("jobLinkerDB").collection("reviews");


        // User related API's

        // Store User Info
        app.post('/users', async (req, res) => {
            try {
                const { name, email, photo, role, coins } = req.body;

                const existingUser = await userCollection.findOne({ email });

                if (existingUser) {

                    return res.status(403).json({ success: false, message: 'User already exists' });
                }

                const result = await userCollection.insertOne({ name, email, photo, role, coins });

                res.send(result);
            }
            catch (error) {
                console.error(error);

            }

        });

        // Get all users
        app.get('/users/workers', async (req, res) => {

            const workers = { role: 'Worker' }
            try {
                const result = await userCollection.find(workers).toArray();
                res.send(result);
            }
            catch (error) {
                res.status(500).send({ message: 'Error fetching workers' });
            }
        });

        // Delete User
        app.delete('/users/:id', async (req, res) => {

            const userId = req.params.id;
            const query = { _id: new ObjectId(userId) }

            try {
                const result = await userCollection.deleteOne(query);

                res.send(result);
            }
            catch (error) {
                console.error("Error deleting user:", error);
                res.status(500).json({ message: 'Failed to delete user', error });
            }
        });


       

        // Get all reviews
        app.get('/reviews', async (req, res) => {

            const result = await reviewCollection.find().toArray();
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Job Linker server is running')
})

app.listen(port, () => {
    console.log(`Job Linker server is running on port ${port}`);
})