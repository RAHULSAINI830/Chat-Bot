// Required Modules
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

require("dotenv").config();

// Initialize App
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    maxPoolSize: 10,
  })
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("MongoDB connection error:", err));

mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Models
const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["user", "admin"], required: true },
  timestamp: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  name: { type: String },
  isBlocked: { type: Boolean, default: false },
  resolved: { type: Boolean, default: false },
});

const fetch = require('node-fetch');
const userAgent = require('user-agent-parser');

const getVisitorInfo = async (req, res, next) => {
    try {
        // Get IP address, fallback to localhost if undefined
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        // Fetch geolocation data using ipinfo.io API
        const ipInfoApiKey = "a4e05408bffeb1"; // Replace with your API key
        const geoResponse = await fetch(`https://ipinfo.io/${ip}?token=${ipInfoApiKey}`);

        // Validate response and parse JSON
        if (!geoResponse.ok) {
            throw new Error(`Failed to fetch IP information: ${geoResponse.statusText}`);
        }
        const geoData = await geoResponse.json();

        // Parse user-agent header for browser and device information
        const userAgentString = req.headers["user-agent"] || "Unknown";
        const deviceInfo = userAgent(userAgentString);

        // Attach visitor information to the request object
        req.visitorInfo = {
            ip: ip,
            city: geoData.city || "Unknown",
            region: geoData.region || "Unknown",
            country: geoData.country || "Unknown",
            timezone: geoData.timezone || "Unknown",
            browser: {
                name: deviceInfo.browser.name || "Unknown",
                version: deviceInfo.browser.version || "Unknown",
            },
            device: {
                type: deviceInfo.device.type || "Desktop",
                os: deviceInfo.os.name || "Unknown",
            },
        };

        console.log("Visitor Info:", req.visitorInfo); // Log for debugging
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error("Error fetching visitor info:", err);

        // Attach default values if fetching fails
        req.visitorInfo = {
            ip: "Unknown",
            city: "Unknown",
            region: "Unknown",
            country: "Unknown",
            timezone: "Unknown",
            browser: {
                name: "Unknown",
                version: "Unknown",
            },
            device: {
                type: "Unknown",
                os: "Unknown",
            },
        };

        next(); // Continue even if visitor info fails
    }
};

// Apply the middleware to all chatbot routes
app.use("/chat", getVisitorInfo);

const Message = mongoose.model("Message", messageSchema);
const User = mongoose.model("User", userSchema);

// WebSocket Handling
io.on("connection", (socket) => {
  console.log("Admin connected");

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("typing", (data) => {
    socket.to(data.userId).emit("typing", { userId: data.userId, typing: data.typing });
  });

  socket.on("adminMessage", async (data) => {
    try {
      const message = new Message({
        userId: data.userId,
        message: data.message,
        type: "admin",
      });
      await message.save();
      socket.to(data.userId).emit("message", message);
    } catch (error) {
      console.error("Error saving admin message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Admin disconnected");
  });
});

// Middleware to Check User Blocking
const checkUserBlocking = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });

    if (user && user.isBlocked) {
      return res.status(403).json({ error: "User is blocked." });
    }

    next();
  } catch (err) {
    console.error("Error in user blocking middleware:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Routes

// Chatbot Logic
app.post("/chat", checkUserBlocking, async (req, res) => {
  const { step, manualQuery, userId } = req.body;

  if (manualQuery) {
    try {
      const message = new Message({
        userId,
        message: manualQuery,
        type: "user",
      });
      await message.save();

      io.emit("message", {
        userId,
        message: manualQuery,
        type: "user",
        timestamp: message.timestamp,
      });

      res.json({
        response: "Thank you for your query. We’ll get back to you shortly.",
      });
    } catch (err) {
      console.error("Error saving user message:", err);
      res.status(500).json({ error: "Failed to save message." });
    }
    return;
  }

  const currentQuestion = questionTree[step] || {
    question: "Sorry, I didn’t understand that. Could you rephrase?",
    options: [],
  };

  res.json({
    question: currentQuestion.question,
    options: currentQuestion.options,
  });
});


// Delete Chat by User ID
app.delete("/admin/delete-chat/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await Message.deleteMany({ userId });
    res.json({ success: true, message: `Chat for user ${userId} has been deleted.` });
  } catch (err) {
    console.error("Error deleting chat:", err);
    res.status(500).json({ error: "Failed to delete chat." });
  }
});
app.get('/admin/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: 1 }).lean();
        const users = await User.find().lean();

        // Merge messages with user visitor information
        const enrichedMessages = messages.map((msg) => {
            const user = users.find((u) => u.userId === msg.userId);
            return {
                ...msg,
                visitorInfo: user ? user.visitorInfo : null, // Attach visitorInfo if available
            };
        });

        res.json(enrichedMessages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

app.post("/chat", async (req, res) => {
    try {
        const { step, manualQuery, userId } = req.body;

        // Get visitor information from middleware
        const visitorInfo = req.visitorInfo;

        // Log or save visitor info in the database
        console.log("Visitor Information:", visitorInfo);

        // Save visitor info in MongoDB (Optional)
        const user = await User.findOneAndUpdate(
            { userId },
            { $set: { visitorInfo: visitorInfo } },
            { upsert: true, new: true }
        );

        // Chatbot logic here...
        res.json({ response: "Captured visitor info and processed chatbot logic." });
    } catch (err) {
        console.error("Error in chat route:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});


// Block User
app.post("/admin/block-user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await User.updateOne({ userId }, { $set: { isBlocked: true } }, { upsert: true });
    res.json({ success: true, message: `User ${userId} has been blocked.` });
  } catch (err) {
    console.error("Error blocking user:", err);
    res.status(500).json({ error: "Failed to block user." });
  }
});

// Resolve User Issue
app.post("/admin/resolve-issue/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await User.updateOne({ userId }, { $set: { resolved: true } }, { upsert: true });
    res.json({ success: true, message: `Issue for user ${userId} has been resolved.` });
  } catch (err) {
    console.error("Error resolving issue:", err);
    res.status(500).json({ error: "Failed to resolve issue." });
  }
});

// Admin Analytics Endpoint
// Define API routes
app.get("/admin/analytics", async (req, res) => {
    try {
        const totalMessages = await Message.countDocuments();
        const activeUsers = await User.countDocuments({ isBlocked: false });
        const resolvedIssues = await User.countDocuments({ resolved: true });

        res.json({
            totalMessages,
            activeUsers,
            resolvedIssues,
        });
    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ error: "Failed to fetch analytics." });
    }
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

// Serve chatbot
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chatbot', 'index.html'));
});

// Static file serving
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.use('/', express.static(path.join(__dirname, 'public', 'chatbot')));

// Question Tree (Predefined Chat Steps)
const questionTree = {
    start: {
        question: "Hello! How can I assist you today?",
        options: [
            { id: "billing", text: "Billing Issues" },
            { id: "tech_support", text: "Technical Support" },
            { id: "product", text: "Product Inquiry" },
            { id: "other", text: "Other" },
        ],
    },
    billing: {
        question: "What kind of billing issue are you experiencing?",
        options: [
            { id: "missing_bill", text: "I didn’t receive my bill." },
            { id: "wrong_amount", text: "The bill amount is incorrect." },
            { id: "payment_help", text: "I need help with payment options." },
            { id: "manual_response", text: "Other" },
        ],
    },
    missing_bill: {
        question: "Did you check your email’s spam folder?",
        options: [
            { id: "yes_checked", text: "Yes, I checked." },
            { id: "no_checked", text: "No, I haven’t checked yet." },
            { id: "manual_response", text: "Other" },
        ],
    },
    yes_checked: {
        question: "If you’ve checked your spam folder and still can’t find the bill, please contact our billing team. Would you like more assistance?",
        options: [
            { id: "manual_response", text: "Yes, please." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    no_checked: {
        question: "Please check your spam folder and let us know if the issue persists. Need more help?",
        options: [
            { id: "manual_response", text: "Yes, I need more help." },
            { id: "no_help", text: "No, I’ll try it myself." },
        ],
    },
    wrong_amount: {
        question: "Can you confirm the incorrect amount?",
        options: [
            { id: "undercharged", text: "I was undercharged." },
            { id: "overcharged", text: "I was overcharged." },
            { id: "manual_response", text: "Other" },
        ],
    },
    undercharged: {
        question: "Thanks for reporting. We’ll review the issue and adjust your bill. Need further assistance?",
        options: [
            { id: "manual_response", text: "Yes, please." },
            { id: "no_help", text: "No, that’s all." },
        ],
    },
    overcharged: {
        question: "We’re sorry for the inconvenience. We’ll investigate the overcharge and adjust it. Need more help?",
        options: [
            { id: "manual_response", text: "Yes, I have more questions." },
            { id: "no_help", text: "No, that’s all." },
        ],
    },
    payment_help: {
        question: "What do you need help with regarding payment?",
        options: [
            { id: "payment_methods", text: "Available payment methods" },
            { id: "payment_failed", text: "Payment failed" },
            { id: "manual_response", text: "Other" },
        ],
    },
    payment_methods: {
        question: "Our payment methods include Credit Card, Debit Card, and PayPal. Do you need more assistance?",
        options: [
            { id: "manual_response", text: "Yes, please." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    payment_failed: {
        question: "What error did you encounter while making the payment?",
        options: [
            { id: "card_declined", text: "Card declined" },
            { id: "transaction_failed", text: "Transaction failed" },
            { id: "manual_response", text: "Other" },
        ],
    },
    tech_support: {
        question: "What technical issue are you facing?",
        options: [
            { id: "login_issues", text: "Unable to log in" },
            { id: "error_messages", text: "Error messages" },
            { id: "performance", text: "Slow performance" },
            { id: "manual_response", text: "Other" },
        ],
    },
    login_issues: {
        question: "Are you unable to reset your password?",
        options: [
            { id: "yes_reset", text: "Yes" },
            { id: "no_reset", text: "No" },
            { id: "manual_response", text: "Other" },
        ],
    },
    error_messages: {
        question: "What type of error message are you seeing?",
        options: [
            { id: "network_error", text: "Network error" },
            { id: "server_error", text: "Server error" },
            { id: "manual_response", text: "Other" },
        ],
    },
    network_error: {
        question: "Please check your internet connection and try again. Need further assistance?",
        options: [
            { id: "manual_response", text: "Yes, please." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    server_error: {
        question: "It seems there’s an issue on our end. Would you like to report this problem?",
        options: [
            { id: "manual_response", text: "Yes, report it." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    performance: {
        question: "Is the app slow or unresponsive?",
        options: [
            { id: "slow", text: "Slow" },
            { id: "unresponsive", text: "Unresponsive" },
            { id: "manual_response", text: "Other" },
        ],
    },
    slow: {
        question: "Please try clearing your cache and restarting the app. Need more assistance?",
        options: [
            { id: "manual_response", text: "Yes, I need more help." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    unresponsive: {
        question: "Are you using the latest version of the app?",
        options: [
            { id: "yes_latest", text: "Yes, I am." },
            { id: "no_latest", text: "No, I’m not." },
            { id: "manual_response", text: "Other" },
        ],
    },
    product: {
        question: "What kind of product inquiry do you have?",
        options: [
            { id: "availability", text: "Product availability" },
            { id: "features", text: "Product features" },
            { id: "pricing", text: "Pricing" },
            { id: "manual_response", text: "Other" },
        ],
    },
    availability: {
        question: "Is there a specific product you’re looking for?",
        options: [
            { id: "specific_product", text: "Yes, a specific product." },
            { id: "general_availability", text: "No, just general availability." },
            { id: "manual_response", text: "Other" },
        ],
    },
    features: {
        question: "What features are you interested in?",
        options: [
            { id: "specific_features", text: "Specific features." },
            { id: "all_features", text: "All features." },
            { id: "manual_response", text: "Other" },
        ],
    },
    pricing: {
        question: "Do you need pricing for a specific product or all products?",
        options: [
            { id: "specific_pricing", text: "Specific product pricing." },
            { id: "general_pricing", text: "General pricing." },
            { id: "manual_response", text: "Other" },
        ],
    },
    manual_response: {
        question: "Please describe your issue in more detail. Our team will get back to you shortly.",
        options: [],
    },
};

// Start Server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
