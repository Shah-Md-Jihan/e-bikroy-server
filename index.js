const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mfyq6m8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// middleware
app.use(cors());
app.use(express.json());

async function run() {
  try {
    // all collections
    const usersCollection = client.db("eBikroy").collection("users");
    const brandsCollection = client.db("eBikroy").collection("brands");
    const addsCollection = client.db("eBikroy").collection("adds");

    // create user api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // check admin api
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    // check seller api
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });

    // add brand api
    app.post("/brands", async (req, res) => {
      const brands = req.body;
      const result = await brandsCollection.insertOne(brands);
      res.send(result);
    });

    // get brands api
    app.get("/brands", async (req, res) => {
      const query = {};
      const brands = await brandsCollection.find(query).toArray();
      res.send(brands);
    });
    // get single brands api
    app.get("/brands/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const brand = await brandsCollection.findOne(query);
      res.send(brand);
    });

    // add advertisement api
    app.post("/post/add", async (req, res) => {
      const addData = req.body;
      const result = await addsCollection.insertOne(addData);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("e-bikroy server is running");
});

app.listen(port, () => {
  console.log(`e-bikroy server is running on ${port}`);
});
