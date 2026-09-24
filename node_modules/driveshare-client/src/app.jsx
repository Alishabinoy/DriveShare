import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams
} from "react-router-dom";


function App() {

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  const login = (user) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <BrowserRouter>

      <nav>
        <Link to="/" className="logo">
          🚗 DriveShare
        </Link>

        <div>
          <Link to="/">Home</Link>

          {user && (
            <>
              <Link to="/create">Create Ride</Link>
              <Link to="/myrides">My Rides</Link>
              <button onClick={logout}>Logout</button>
            </>
          )}

          {!user && (
            <Link to="/login">Login</Link>
          )}
        </div>
      </nav>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={<Login login={login} />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/create"
          element={<CreateRide user={user} />}
        />

        <Route
          path="/ride/:id"
          element={<RideDetails user={user} />}
        />

        <Route
          path="/myrides"
          element={<MyRides user={user} />}
        />

      </Routes>

    </BrowserRouter>
  );
}


/* ---------- HOME ---------- */

function Home() {

  const [rides, setRides] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {

    fetch("/api/rides")
      .then(res => res.json())
      .then(data => setRides(data));

  }, []);

  const filtered = rides.filter(ride =>
    ride.to.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main>

      <section className="hero">
        <h1>Find Your Ride 🚗</h1>

        <p>
          Travel together. Save money. Meet your college friends.
        </p>

        <input
          placeholder="Search destination..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </section>


      <h2>Available Rides</h2>

      <div className="rides">

        {filtered.map(ride => (

          <div className="card" key={ride.id}>

            <h3>
              {ride.from} → {ride.to}
            </h3>

            <p>📅 {ride.date}</p>
            <p>🕐 {ride.time}</p>
            <p>💺 {ride.seats} seats</p>
            <p>👤 {ride.owner}</p>

            <Link to={`/ride/${ride.id}`}>
              <button>View Ride</button>
            </Link>

          </div>

        ))}

      </div>

    </main>
  );
}


/* ---------- LOGIN ---------- */

function Login({ login }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const submit = async e => {

    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();

    if (res.ok) {

      login(data);
      navigate("/");

    } else {

      alert(data.message);

    }
  };

  return (
    <main className="form-page">

      <form onSubmit={submit}>

        <h1>Login</h1>

        <input
          type="email"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        <button>Login</button>

        <p>
          Don't have an account?
          <Link to="/signup"> Sign Up</Link>
        </p>

      </form>

    </main>
  );
}


/* ---------- SIGNUP ---------- */

function Signup() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const navigate = useNavigate();

  const change = e => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };

  const submit = async e => {

    e.preventDefault();

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
      navigate("/login");
    }
  };

  return (
    <main className="form-page">

      <form onSubmit={submit}>

        <h1>Create Account</h1>

        <input
          name="name"
          placeholder="Name"
          onChange={change}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={change}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={change}
        />

        <button>Sign Up</button>

      </form>

    </main>
  );
}


/* ---------- CREATE RIDE ---------- */

function CreateRide({ user }) {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    seats: 1
  });

  const change = e => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };

  const submit = async e => {

    e.preventDefault();

    if (!user) {
      alert("Please login first");
      return;
    }

    await fetch("/api/rides", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...form,
        owner: user.name
      })
    });

    alert("Ride created!");
    navigate("/");
  };

  return (
    <main className="form-page">

      <form onSubmit={submit}>

        <h1>Create a Ride 🚗</h1>

        <input
          name="from"
          placeholder="From"
          onChange={change}
        />

        <input
          name="to"
          placeholder="Destination"
          onChange={change}
        />

        <input
          name="date"
          type="date"
          onChange={change}
        />

        <input
          name="time"
          type="time"
          onChange={change}
        />

        <input
          name="seats"
          type="number"
          min="1"
          placeholder="Available seats"
          onChange={change}
        />

        <button>Create Ride</button>

      </form>

    </main>
  );
}


/* ---------- RIDE DETAILS ---------- */

function RideDetails({ user }) {

  const { id } = useParams();

  const [ride, setRide] = useState(null);

  useEffect(() => {

    fetch(`/api/rides/${id}`)
      .then(res => res.json())
      .then(data => setRide(data));

  }, [id]);

  if (!ride) {
    return <main><h2>Loading...</h2></main>;
  }

  const request = async () => {

    if (!user) {
      alert("Please login first");
      return;
    }

    const res = await fetch(
      `/api/rides/${id}/request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: user.name
        })
      }
    );

    const data = await res.json();

    alert(data.message);
  };

  return (
    <main>

      <div className="details">

        <h1>
          {ride.from} → {ride.to}
        </h1>

        <p>📅 {ride.date}</p>
        <p>🕐 {ride.time}</p>
        <p>💺 {ride.seats} seats available</p>
        <p>👤 Posted by {ride.owner}</p>

        {ride.owner !== user?.name && (
          <button onClick={request}>
            Request to Join
          </button>
        )}

      </div>

    </main>
  );
}


/* ---------- MY RIDES ---------- */

function MyRides({ user }) {

  const [rides, setRides] = useState([]);

  useEffect(() => {

    fetch("/api/rides")
      .then(res => res.json())
      .then(data => setRides(data));

  }, []);

  if (!user) {
    return (
      <main>
        <h2>Please login to view your rides.</h2>
      </main>
    );
  }

  const myRides = rides.filter(
    ride => ride.owner === user.name
  );

  const accept = async (rideId, name) => {

    await fetch(`/api/rides/${rideId}/accept`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user: name
      })
    });

    alert("Request accepted");

    window.location.reload();
  };

  return (
    <main>

      <h1>My Rides</h1>

      {myRides.map(ride => (

        <div className="card" key={ride.id}>

          <h3>
            {ride.from} → {ride.to}
          </h3>

          <p>{ride.date} | {ride.time}</p>

          <h4>Join Requests</h4>

          {ride.requests.length === 0 ? (
            <p>No requests yet.</p>
          ) : (

            ride.requests.map(name => (

              <div className="request" key={name}>

                <span>{name}</span>

                <button
                  onClick={() =>
                    accept(ride.id, name)
                  }
                >
                  Accept
                </button>

              </div>

            ))

          )}

        </div>

      ))}

    </main>
  );
}


export default App;