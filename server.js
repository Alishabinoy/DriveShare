const express = require("express");
const path = require("path");
const net = require("node:net");
const connectDB = require("./db");

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

function getNextAvailablePort(startPort = DEFAULT_PORT, maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, attemptsLeft) => {
      const tester = net.createServer();

      tester.once("error", err => {
        if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
          return tryPort(port + 1, attemptsLeft - 1);
        }

        reject(err);
      });

      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });

      tester.listen(port);
    };

    tryPort(startPort, maxAttempts);
  });
}

app.use(express.json());

// Users are now stored in MongoDB

// Rides are now stored in MongoDB

/* LOGIN */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const db = await connectDB();

  const user = await db.collection("users").findOne({
    email,
    password
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid login" });
  }

  res.json({
    id: user._id,
    name: user.name,
    email: user.email
  });
});

/* SIGNUP */
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const db = await connectDB();

  const existingUser = await db.collection("users").findOne({ email });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  await db.collection("users").insertOne({
    name,
    email,
    password
  });

  res.json({ message: "Signup successful" });
});

/* GET ALL RIDES */
app.get("/api/rides", async (req, res) => {
  const db = await connectDB();

  const rides = await db.collection("rides").find().toArray();

  res.json(rides);
});

/* GET ONE RIDE */
app.get("/api/rides/:id", async (req, res) => {
  const { ObjectId } = require("mongodb");
  const db = await connectDB();

  const ride = await db.collection("rides").findOne({
    _id: new ObjectId(req.params.id)
  });

  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  res.json(ride);
});

/* CREATE RIDE */
app.post("/api/rides", async (req, res) => {
  const { from, to, date, time, seats, owner } = req.body;

  const db = await connectDB();

  const ride = {
    from,
    to,
    date,
    time,
    seats: Number(seats),
    owner,
    requests: []
  };

  const result = await db.collection("rides").insertOne(ride);

  res.json({
    message: "Ride created",
    ride: { ...ride, _id: result.insertedId }
  });
});

/* REQUEST TO JOIN */
app.post("/api/rides/:id/request", async (req, res) => {
  const { ObjectId } = require("mongodb");
  const { user } = req.body;

  const db = await connectDB();

  const ride = await db.collection("rides").findOne({
    _id: new ObjectId(req.params.id)
  });

  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  if (ride.seats <= 0) {
    return res.status(400).json({ message: "No seats available" });
  }

  await db.collection("joinRequests").insertOne({
    rideId: ride._id,
    user,
    status: "PENDING"
  });

  res.json({ message: "Request sent" });
});

app.get("/api/rides/:id/requests", async (req, res) => {
  const { ObjectId } = require("mongodb");
  const db = await connectDB();

  const requests = await db.collection("joinRequests")
    .find({
      rideId: new ObjectId(req.params.id)
    })
    .toArray();

  res.json(requests);
});

/* ACCEPT REQUEST */
app.put("/api/rides/:id/accept", async (req, res) => {
  const { ObjectId } = require("mongodb");
  const { user } = req.body;

  const db = await connectDB();

  const ride = await db.collection("rides").findOne({
    _id: new ObjectId(req.params.id)
  });

  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  const request = await db.collection("joinRequests").findOne({
    rideId: ride._id,
    user: user,
    status: "PENDING"
  });

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  if (ride.seats <= 0) {
    return res.status(400).json({ message: "No seats available" });
  }

  await db.collection("joinRequests").updateOne(
    { _id: request._id },
    { $set: { status: "ACCEPTED" } }
  );

  await db.collection("rides").updateOne(
    { _id: ride._id },
    { $inc: { seats: -1 } }
  );

  res.json({ message: "Request accepted" });
});

/* SERVE REACT */
app.use(express.static(path.join(__dirname, "client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

async function startServer(port = DEFAULT_PORT) {
  await connectDB();
  const availablePort = await getNextAvailablePort(port);

  app.listen(availablePort, () => {
    console.log(`DriveShare running at http://localhost:${availablePort}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

module.exports = {
  app,
  getNextAvailablePort,
  startServer
};