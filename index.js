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
        const taskCollection = client.db("jobLinkerDB").collection("tasks");
        const submissionCollection = client.db("jobLinkerDB").collection("submissions");


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
        app.get('/users', async (req, res) => {

            try {
                const result = await userCollection.find().toArray();
                res.send(result);
            }
            catch (error) {
                res.status(500).send({ message: 'Error fetching workers' });
            }
        });

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

        // Get user role by email
        app.get('/user/:email', async (req, res) => {

            const email = req.params.email;

            try {
                const result = await userCollection.findOne({ email })
                res.send(result);
            }
            catch (error) {
                res.status(500).send({ message: 'Error fetching User Role' });
            }

        })

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

        // Update user role
        app.patch('/users/:id/role', async (req, res) => {

            const userId = req.params.id;
            const { role } = req.body;

            const user = { _id: new ObjectId(userId) }
            const newRole = { $set: { role: role } }

            try {
                const result = await userCollection.updateOne(user, newRole);

                res.send(result)
            }
            catch (error) {

                console.error("Error updating user role:", error);
            }
        });

        // Get All Tasks
        app.get('/tasks', async (req, res) => {

            try {
                const result = await taskCollection.find().toArray();
                res.send(result);
            }
            catch (error) {
                res.status(500).send({ message: 'Error fetching workers' });
            }
        });

        // Add Task
        app.post('/tasks', async (req, res) => {

            const taskInfo = req.body;

            try {

                const result = await taskCollection.insertOne(taskInfo);

                res.status(201).send({ message: 'Task created successfully', taskId: result.insertedId });
            }
            catch (error) {
                console.error('Error adding task:', error);
                res.status(500).send({ error: 'Failed to create task' });
            }
        });


        // Delete Task
        app.delete('/tasks/:id', async (req, res) => {

            const userId = req.params.id;
            const query = { _id: new ObjectId(userId) }

            try {
                const result = await taskCollection.deleteOne(query);

                res.send(result);
            }
            catch (error) {
                console.error("Error deleting this task:", error);
                res.status(500).json({ message: 'Failed to delete this task', error });
            }
        });

        // Post Submissions
        app.post('/submissions', async (req, res) => {
            try {
                const {
                    task_id,
                    task_title,
                    task_detail,
                    task_img,
                    payable_amount,
                    worker_email,
                    submission_details,
                    worker_name,
                    creator_name,
                    creator_email,
                    current_date,
                    status,
                } = req.body;

                const result = await submissionCollection.insertOne({
                    task_id,
                    task_title,
                    task_detail,
                    task_img,
                    payable_amount,
                    worker_email,
                    submission_details,
                    worker_name,
                    creator_name,
                    creator_email,
                    current_date,
                    status,
                });

                if (result.insertedId) {

                    return res.status(201).json({ success: true, message: 'Submission successful' });
                }

            }
            catch (error) {

                console.error('Error inserting submission:', error.stack || error.message);

                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });

        // Get Submissions by Worker Email
        app.get('/submissions', async (req, res) => {

            try {
                const workerEmail = req.query.workerEmail;

                const query = { worker_email: workerEmail };

                if (!workerEmail) {

                    return res.status(400).json({ success: false, message: 'Worker email is required' });
                }

                const result = await submissionCollection.find(query).toArray();

                return res.status(200).json({ success: true, data: result });
            }
            catch (error) {
                console.error('Error retrieving submissions:', error);

                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });

        // Post Withdrawal
        app.post('/withdrawals', async (req, res) => {
            try {
                const {
                    worker_email,
                    worker_name,
                    withdraw_coin,
                    withdraw_amount,
                    payment_system,
                    account_number,
                    withdraw_time,
                } = req.body;

                // Validation
                if (!worker_email || !worker_name || !withdraw_coin || !withdraw_amount || !payment_system || !account_number) {
                    return res.status(400).json({ success: false, message: 'Missing required fields' });
                }

                // Insert the document into the collection
                const result = await withdrawCollection.insertOne({
                    worker_email,
                    worker_name,
                    withdraw_coin,
                    withdraw_amount,
                    payment_system,
                    account_number,
                    withdraw_time,
                });

                // Check if the insert was successful
                if (result.insertedCount === 1) {
                    return res.status(201).json({ success: true, message: 'Withdrawal request successful' });
                } else {
                    return res.status(500).json({ success: false, message: 'Failed to process withdrawal request' });
                }
            } catch (error) {
                console.error('Error processing withdrawal:', error);
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });

        // Get Tasks by Worker Email
        app.get('/submissions', async (req, res) => {

            try {
                const creatorEmail = req.query.creatorEmail;

                const query = { creator_email: creatorEmail };

                if (!creatorEmail) {

                    return res.status(400).json({ success: false, message: 'creator email is required' });
                }

                const result = await taskCollection.find(query).toArray();

                return res.status(200).json({ success: true, data: result });
            }
            catch (error) {
                console.error('Error retrieving tasks:', error);

                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });

        app.patch('/tasks/:id', async (req, res) => {
            const { id } = req.params;
            const { task_title, task_detail, submission_info } = req.body;

            try {
                // Validate input
                if (!task_title || !task_detail || !submission_info) {
                    return res.status(400).send({ error: 'All fields are required' });
                }

                // Update the task
                const result = await taskCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            task_title,
                            task_detail,
                            submission_info
                        }
                    }
                );

                if (result.modifiedCount === 0) {
                    return res.status(404).send({ error: 'Task not found or no changes made' });
                }

                res.send({ message: 'Task updated successfully' });
            }
            catch (error) {
                console.error('Error updating task:', error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        app.delete('/tasks/:id', async (req, res) => {
            const { id } = req.params;
            const userId = req.user.id;
            const query = { _id: new ObjectId(id) }

            try {

                const result = await taskCollection.findOneAndDelete(query);

                if (!result.value) {
                    return res.status(404).send({ error: 'Task not found' });
                }

                const totalAmount = result.value.task_quantity * result.value.payable_amount;

                // Update the user's available coins
                await userCollection.updateOne(
                    { _id: new ObjectId(userId) },
                    { $inc: { available_coins: totalAmount } }
                );

                res.send({ message: 'Task deleted and coins updated' });
            } 
            catch (error) {
                console.error('Error deleting task:', error);
                res.status(500).send({ error: 'Internal Server Error' });
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