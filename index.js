const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mfyq6m8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
}

// middleware
app.use(cors());
app.use(express.json());

async function run() {
  try {
    // all collections
    const usersCollection = client.db("eBikroy").collection("users");
    const brandsCollection = client.db("eBikroy").collection("brands");
    const addsCollection = client.db("eBikroy").collection("adds");
    const ordersCollection = client.db("eBikroy").collection("orders");
    const paymentsCollection = client.db("eBikroy").collection("payments");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      res.send({ token });
    });

    // create user api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      const price = order.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payment store in db api
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.orderId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await ordersCollection.updateOne(filter, updatedDoc);
      const addId = payment.productId;
      const addFilter = { _id: ObjectId(addId) };
      const updateAdd = {
        $set: {
          paid: true,
          advertisement: "false",
        },
      };
      const updatedAddResult = await addsCollection.updateOne(addFilter, updateAdd);
      res.send(result);
    });

    // get all user api
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // delete user api
    app.delete("/user/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
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

    // add order api
    app.post("/order/add", async (req, res) => {
      const orderData = req.body;
      const result = await ordersCollection.insertOne(orderData);
      res.send(result);
    });
    // buyer wise orders
    app.get("/order/all/:email", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log("inside order api", decoded);
      if (decoded.email !== req.params.email) {
        res.status(403).send({ message: "forbidden access" });
      }
      const email = req.params.email;
      const query = { buyerEmail: email };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });

    //Check advertisement api
    app.get("/adds/advertisement", async (req, res) => {
      const query = {};
      const advertisement = await addsCollection.find(query).toArray();
      const adds = advertisement.filter((x) => x.advertisement === "true" && x.paid !== true);
      res.send(adds);
    });

    // delete seller products
    app.delete("/adds/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await addsCollection.deleteOne(query);
      res.send(result);
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
      const unPaid = products.filter((x) => x.paid !== true);
      res.send(unPaid);
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
