const express = require("express");
const path = require("path");
const net = require("node:net");

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

let users = [];

let rides = [
  {
    id: 1,
    from: "RSET",
    to: "Kakkanad Metro",
    date: "2026-09-01",
    time: "5:00 PM",
    seats: 2,
    owner: "Anu",
    requests: []
  },
  {
    id: 2,
    from: "RSET",
    to: "Aluva",
    date: "2026-09-01",
    time: "4:30 PM",
    seats: 3,
    owner: "Rahul",
    requests: []
  }
];

/* LOGIN */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid login"
    });
  }

  res.json(user);
});

/* SIGNUP */
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({
      message: "User already exists"
    });
  }

  const user = {
    id: users.length + 1,
    name,
    email,
    password
  };

  users.push(user);

  res.json({
    message: "Signup successful"
  });
});

/* GET ALL RIDES */
app.get("/api/rides", (req, res) => {
  res.json(rides);
});

/* GET ONE RIDE */
app.get("/api/rides/:id", (req, res) => {
  const ride = rides.find(r => r.id == req.params.id);

  if (!ride) {
    return res.status(404).json({
      message: "Ride not found"
    });
  }

  res.json(ride);
});

/* CREATE RIDE */
app.post("/api/rides", (req, res) => {
  const { from, to, date, time, seats, owner } = req.body;

  const ride = {
    id: rides.length + 1,
    from,
    to,
    date,
    time,
    seats: Number(seats),
    owner,
    requests: []
  };

  rides.push(ride);

  res.json({
    message: "Ride created",
    ride
  });
});

/* REQUEST TO JOIN */
app.post("/api/rides/:id/request", (req, res) => {
  const ride = rides.find(r => r.id == req.params.id);
  const { user } = req.body;

  if (!ride) {
    return res.status(404).json({
      message: "Ride not found"
    });
  }

  if (ride.seats <= 0) {
    return res.status(400).json({
      message: "No seats available"
    });
  }

  ride.requests.push(user);

  res.json({
    message: "Request sent"
  });
});

/* ACCEPT REQUEST */
app.put("/api/rides/:id/accept", (req, res) => {
  const ride = rides.find(r => r.id == req.params.id);
  const { user } = req.body;

  if (!ride) {
    return res.status(404).json({
      message: "Ride not found"
    });
  }

  ride.requests = ride.requests.filter(r => r !== user);

  if (ride.seats > 0) {
    ride.seats--;
  }

  res.json({
    message: "Request accepted"
  });
});

/* SERVE REACT */
app.use(express.static(path.join(__dirname, "client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

async function startServer(port = DEFAULT_PORT) {
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