import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import NodeCache from "node-cache";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads/"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

app.use(express.json());
app.use(cookieParser());
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.ATLAS_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

const vfyCodeCache = new NodeCache({ stdTTL: 300 });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    password: { type: String, required: true },
    refreshToken: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, default: "General" },
    capacity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.userName, email: user.email },
    process.env.ACCESS_SECRET_TOKEN,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_SECRET_TOKEN, {
    expiresIn: "7d",
  });
};

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    mongoStatus:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/api/check-username", async (req, res) => {
  try {
    const user = await User.findOne({ userName: req.query.userName }).lean();
    res.json({ exists: !!user });
  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({ exists: false, error: "Server error" });
  }
});

app.get("/api/check-email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.query.email }).lean();
    res.json({ exists: !!user });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ exists: false, error: "Server error" });
  }
});

app.post("/api/verify-email", async (req, res) => {
  try {
    const { email, firstName = "", lastName = "", type } = req.body;

    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: "Email and type are required",
      });
    }

    if (type === "VERIFY_EMAIL") {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
          type: "VERIFY_EMAIL",
        });
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    vfyCodeCache.set(`${type}:${email}`, code, 300);

    let subject, html;

    if (type === "VERIFY_EMAIL") {
      subject = "Verify your Email - EventFlow";
      html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to EventFlow, ${firstName} ${lastName}!</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 36px; color: #4f46e5; letter-spacing: 5px;">
            ${code}
          </h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;
    }

    if (type === "FORGOT_PASSWORD") {
      subject = "Reset Password - EventFlow";
      html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Your password reset code is:</p>
          <h1 style="font-size: 36px; color: #4f46e5; letter-spacing: 5px;">
            ${code}
          </h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `;
    }

    await transporter.sendMail({
      from: `"EventFlow" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });

    res.json({
      success: true,
      message: "Verification code sent successfully. Check your inbox.",
      type: type,
    });
  } catch (error) {
    console.error("Send code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
      type: req.body.type || "unknown",
    });
  }
});

app.post("/api/verify-code", async (req, res) => {
  try {
    const { email, code, type } = req.body;

    if (!email || !code || !type) {
      return res.status(400).json({
        success: false,
        message: "Email, code, and type are required",
      });
    }

    const cached = vfyCodeCache.get(`${type}:${email}`);

    if (!cached) {
      return res.status(400).json({
        success: false,
        message: "Code expired or invalid",
      });
    }

    if (cached !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    vfyCodeCache.del(`${type}:${email}`);

    res.json({
      success: true,
      message:
        type === "VERIFY_EMAIL"
          ? "Email verified successfully!"
          : "Code verified successfully!",
      type: type,
    });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, userName, password } = req.body;

    if (!firstName || !lastName || !email || !userName || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or username",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      userName,
      password: hashedPassword,
      isVerified: true,
    });

    res.json({
      success: true,
      message: "Account created successfully! Redirecting to login...",
      type: "account_created",
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create account. Please try again.",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { userName: identifier }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentials",
        type: "login",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        type: "login",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = hashToken(refreshToken);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken,
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userName: user.userName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

app.post("/refresh-token", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);

    const hashed = hashToken(token);
    const user = await User.findOne({ refreshToken: hashed });
    if (!user) return res.sendStatus(403);

    jwt.verify(token, process.env.REFRESH_SECRET_TOKEN, (err, decoded) => {
      if (err) return res.sendStatus(403);

      const newAccessToken = generateAccessToken(user);
      res.json({
        success: true,
        accessToken: newAccessToken,
      });
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.sendStatus(500);
  }
});

app.post("/update-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashed });

    res.json({
      success: true,
      message: "Password updated successfully",
      type: "UPDATED_PASSWORD",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
});

app.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const hashed = hashToken(token);
      await User.updateOne({ refreshToken: hashed }, { refreshToken: null });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "firstName lastName userName email")
      .populate("attendees", "firstName lastName userName")
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/events/my-events", authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.id })
      .populate("attendees", "firstName lastName userName")
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error("Get user events error:", error);
    res.status(500).json({ error: "Failed to fetch user events" });
  }
});

app.post(
  "/api/events",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const eventData = {
        title: req.body.title,
        description: req.body.description,
        date: new Date(req.body.date),
        time: req.body.time,
        location: req.body.location,
        category: req.body.category || "General",
        capacity: parseInt(req.body.capacity),
        createdBy: req.user.id,
        attendees: [],
      };

      if (req.file) {
        eventData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const event = new Event(eventData);
      await event.save();

      const populatedEvent = await Event.findById(event._id)
        .populate("createdBy", "firstName lastName userName email")
        .populate("attendees", "firstName lastName userName");

      res.status(201).json(populatedEvent);
    } catch (error) {
      console.error("Create event error:", error);
      res
        .status(400)
        .json({ error: "Failed to create event: " + error.message });
    }
  }
);

app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "firstName lastName userName email")
      .populate("attendees", "firstName lastName userName");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Get single event error:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

app.put(
  "/api/events/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (event.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to edit this event" });
      }

      const updateData = {};
      if (req.body.title) updateData.title = req.body.title.trim();
      if (req.body.description)
        updateData.description = req.body.description.trim();
      if (req.body.date) {
        const parsedDate = new Date(req.body.date);
        if (isNaN(parsedDate))
          return res.status(400).json({ error: "Invalid date format" });
        updateData.date = parsedDate;
      }
      if (req.body.time) updateData.time = req.body.time;
      if (req.body.location) updateData.location = req.body.location.trim();
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.capacity) {
        const parsedCapacity = parseInt(req.body.capacity);
        if (isNaN(parsedCapacity) || parsedCapacity < 1)
          return res.status(400).json({ error: "Invalid capacity" });
        if (parsedCapacity < event.attendees.length) {
          return res.status(400).json({
            error: `Capacity cannot be less than current attendees (${event.attendees.length})`,
          });
        }
        updateData.capacity = parsedCapacity;
      }

      if (updateData.capacity < event.attendees.length) {
        return res.status(400).json({
          error: `Capacity cannot be less than current attendees (${event.attendees.length})`,
        });
      }

      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      Object.assign(event, updateData);
      await event.save();

      const updatedEvent = await Event.findById(event._id)
        .populate("createdBy", "firstName lastName userName email")
        .populate("attendees", "firstName lastName userName");

      res.json(updatedEvent);
    } catch (error) {
      console.error("Update event error:", error);
      res
        .status(400)
        .json({ error: "Failed to update event: " + error.message });
    }
  }
);

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this event" });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.post("/api/events/:id/rsvp", authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findById(req.params.id).session(session);

    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.attendees.length >= event.capacity) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Event is at full capacity" });
    }

    if (event.attendees.includes(req.user.id)) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Already RSVPed to this event" });
    }

    if (event.createdBy.toString() === req.user.id) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Cannot RSVP to your own event" });
    }

    event.attendees.push(req.user.id);
    await event.save({ session });

    await session.commitTransaction();

    const updatedEvent = await Event.findById(event._id)
      .populate("createdBy", "firstName lastName userName email")
      .populate("attendees", "firstName lastName userName");

    res.json({
      message: "Successfully RSVPed to event",
      event: updatedEvent,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("RSVP error:", error);
    res.status(500).json({ error: "Failed to RSVP" });
  } finally {
    session.endSession();
  }
});

app.delete("/api/events/:id/rsvp", authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!event.attendees.includes(req.user.id)) {
      return res
        .status(400)
        .json({ error: "You have not RSVPed to this event" });
    }

    event.attendees = event.attendees.filter(
      (attendeeId) => attendeeId.toString() !== req.user.id
    );
    await event.save();

    res.json({ message: "RSVP cancelled successfully" });
  } catch (error) {
    console.error("Cancel RSVP error:", error);
    res.status(500).json({ error: "Failed to cancel RSVP" });
  }
});

app.get("/api/event-categories", async (req, res) => {
  const categories = [
    "Technology",
    "Business",
    "Arts",
    "Sports",
    "Education",
    "Networking",
    "Social",
    "Other",
  ];
  res.json(categories);
});

app.get("/api/events/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    const events = await Event.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    })
      .populate("createdBy", "firstName lastName userName email")
      .populate("attendees", "firstName lastName userName")
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error("Search events error:", error);
    res.status(500).json({ error: "Failed to search events" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
