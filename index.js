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

    // get all user api
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // get all seller api
    app.get("/sellers", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      const adds = result.filter((x) => x.role === "seller");
      res.send(adds);
    });

    // get all buyers api
    app.get("/buyers", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      const adds = result.filter((x) => x.role !== "admin" && x.role !== "seller");
      res.send(adds);
    });

    // get email wise user api
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
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
      res.send({ isSeller: user?.role === "seller" && user?.active === "true" });
    });

    // seller verified api
    app.put("/users/verify/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verified: "true",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    // activity change api
    app.put("/users/activity/change/true/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          active: "true",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });
    app.put("/users/activity/change/false/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          active: "false",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
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
    app.get("/category/:id", async (req, res) => {
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

    //Check advertisement api
    app.get("/adds/advertisement", async (req, res) => {
      const query = {};
      const advertisement = await addsCollection.find(query).toArray();
      const adds = advertisement.filter((x) => x.advertisement === "true");
      res.send(adds);
    });

    // update seller verification in post collection
    app.put("/add/verify/seller/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { sellerEmail: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verified: "true",
        },
      };
      const result = await addsCollection.updateMany(filter, updatedDoc, options);
      res.send(result);
    });

    // get seller wise advertisement api
    app.get("/adds/:email", async (req, res) => {
      const email = req.params.email;
      const query = { sellerEmail: email };
      const adds = await addsCollection.find(query).toArray();
      res.send(adds);
    });

    // get make product advertisement api
    app.put("/adds/make/advertisement/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          advertisement: "true",
        },
      };
      const result = await addsCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    // get brand wise advertisement api
    app.get("/products/:brand", async (req, res) => {
      const brand = req.params.brand;
      const query = { brand: brand };
      const products = await addsCollection.find(query).toArray();
      res.send(products);
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
