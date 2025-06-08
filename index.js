const express = require('express')
var cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(cors())








const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB}:${process.env.password}@cluster0.hwuf8vx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db("SocialWorkDB");
        const eventsCollection = database.collection("events");
        const joinedEvents = database.collection("joinedEvents");



        app.post("/api/events", async (req, res) => {
            try {
                const {
                    title, description, eventType, thumbnail,
                    location, eventDate, email
                } = req.body;


                if (!title || !description || !eventType || !thumbnail ||
                    !location || !eventDate || !email) {
                    return res.status(400).send({ message: "All fields are required" });
                }

                const Data = {
                    title,
                    description,
                    eventType,
                    thumbnail,
                    location,
                    eventDate: new Date(eventDate),
                    email,
                    createdAt: new Date()
                };

                const result = await eventsCollection.insertOne(Data);
                res.send({ message: "Event created successfully" });
            } catch (err) {
                res.status(500).send({ message: "Failed to create event", error: err.message });
            }
        });



        app.get("/api/events", async (req, res) => {
            try {
                const currentDate = new Date();
                const { type, search } = req.query;

                const query = { eventDate: { $gte: currentDate } };

                if (type) query.eventType = type;
                if (search) query.title = { $regex: search, $options: "i" };

                const events = await eventsCollection
                    .find(query)
                    .sort({ eventDate: 1 })
                    .toArray();

                res.send(events);
            } catch (err) {
                res.status(500).send({ message: "Failed to fetch events", error: err.message });
            }
        });

        app.get("/api/events/by-email", async (req, res) => {
            try {
                const email = req.query.email;
                if (!email) return res.status(400).send({ message: "Email is required" });

                const events = await eventsCollection.find({ email: email }).toArray();
                res.send(events);
            } catch (err) {
                res.status(500).send({ message: "Failed to fetch events", error: err.message });
            }
        });


        app.get("/api/event/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
                res.send(event);
            } catch (err) {
                res.status(500).send({ message: "Failed to fetch event", error: err.message });
            }
        });


        app.patch("/api/event/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const updateData = req.body;

                if (updateData.eventDate) {
                    updateData.eventDate = new Date(updateData.eventDate);
                }

                const result = await eventsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                res.send({ message: "Event updated", result });
            } catch (err) {
                console.log(err);
                res.status(500).send({ message: "Failed to update event", error: err.message });
            }
        });

        app.delete("/api/event/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).send({ message: "Event not found" });
                }
                res.send({ message: "Event deleted successfully", result });
            } catch (err) {
                res.status(500).send({ message: "Failed to delete event", error: err.message });
            }
        });



        app.post('/api/join-event', async (req, res) => {
            const { title, description, eventType, thumbnail, location, eventDate, email } = req.body;

            // validate
            if (!title || !email) return res.status(400).json({ error: "Missing required fields" });

            const newJoin = {
                title,
                description,
                eventType,
                thumbnail,
                location,
                eventDate: new Date(eventDate),
                email
            };

            const result = await joinedEvents.insertOne(newJoin);
            res.status(201).json({ message: "Event joined successfully", result });
        });


        app.get("/api/joined-events", async (req, res) => {
            const email = req.query.email;
            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }

            try {
                const events = await joinedEvents.find({ email }).toArray();
                res.send(events);
            } catch (error) {
                console.error("Error fetching joined events:", error);
                res.status(500).send({ message: "Server error" });
            }
        });



    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);












app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
