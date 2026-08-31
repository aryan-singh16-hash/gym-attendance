const express = require("express");
const cors = require("cors");
const attendance = require("./data");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const ADMIN = {
  email: "owner@gym.com",
  password: "gym123"
};

const JWT_SECRET = "gym_secret_key";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Gym Attendance Backend is Running 🚀");
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN.email || password !== ADMIN.password) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  const token = jwt.sign(
    { email },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    access_token: token,
    token_type: "bearer"
  });
});

app.post("/api/attendance", (req, res) => {
  const { name, phone_number, roll_number, session } = req.body;

const now = new Date();

const member = {
  id: Date.now(),
  name,
  phone_number,
  roll_number,
  session,
  timing: now.toLocaleTimeString(),
  date: now.toISOString().split("T")[0],
  created_at: now,
};

  attendance.push(member);

  console.log(member);

  res.json({
    success: true,
    message: "Attendance Saved",
  });
});
app.get("/api/attendance", (req, res) => {
  res.json(attendance);
});
app.get("/api/admin/attendance", (req, res) => {
  const { date, session, search } = req.query;

  let records = attendance;

  if (date) {
    records = records.filter(
      (item) => item.date === date
    );
  }

  if (session) {
    records = records.filter(
      (item) => item.session === session
    );
  }

  if (search) {
    records = records.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.roll_number.includes(search)
    );
  }

  res.json({
    records,
    total: records.length,
    morning_count: records.filter(
      (item) => item.session === "Morning"
    ).length,
    evening_count: records.filter(
      (item) => item.session === "Evening"
    ).length,
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});