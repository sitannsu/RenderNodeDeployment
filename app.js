const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { Server } = require("socket.io");
const socketManager = require('./utils/socketManager');

// Initialize Express app
const app = express();

// Import routes
const testRoutes = require('./routes/testRoutes');
const versionRoute = require('./routes/versionRoute');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io server on the same HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

socketManager.init(io);

// Set up middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use('/api/test', testRoutes);
app.use('/api/version', versionRoute);
app.use(function (req, res, next) {
  //res.header("Access-Control-Allow-Origin", "https://dgp-website.onrender.com");
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// Handle Socket.io connections
io.on("connection", socket => {
  console.log("Socket.io client connected", socket.id);

  let userId;

  socket.on("register", ({ userId: id, userRole }) => {
    console.log("User registered:", { id, userRole });
    userId = id;

    if (userRole !== "user") {
      const client = clients.get("99999") || {};
      client[id] = socket;
      clients.set("99999", client);
    } else {
      socket.join("products"); 
      clients.set(id, socket);
    }
  });

  socket.on("read", ({ userId, userRole, orderId }) => {
    changeMessageStatus(userId, userRole, orderId);
  });

  socket.on("disconnect", () => {
    if (userId) {
      // Remove the userId from clients map when the connection closes
      clients.delete(userId);
      console.log(`Socket.io client disconnected, removed userId: ${userId}`);
    } else {
      console.log("Socket.io client disconnected");
    }
  });

  socket.on("error", error => {
    console.error("Socket.io error:", error);
  });
});

// ROUTE IMPORTS
const routes = require("./routes/index");
const { changeMessageStatus } = require("./controllers/chatController");
const { clients } = require("./utils/otpUtils");

app.use("/", routes);

app.init = () => {
  server.listen(process.env.PORT, () => {
    console.log(`Server is working on http://localhost:${process.env.PORT}`);
  });
};

module.exports = app;
