Mini Event Planner 🎉

A full-stack MERN application for creating, managing, and attending events with secure authentication, image uploads, and email verification.

📌 Project Overview

Mini Event Planner is a production-ready event management platform that allows users to:

Create and manage events

Join events and track attendance

Upload event images

Authenticate securely using JWT

Verify email and reset passwords via email

Access the app securely using HTTP-only cookies

The project follows industry-standard best practices for security, environment configuration, and deployment.

🏗 Architecture
Client (Vite + React)
│
│ HTTPS (REST API)
▼
Server (Node.js + Express)
│
▼
MongoDB Atlas

Frontend: Deployed on Vercel

Backend: Deployed on a Node hosting platform (Render / Railway / Fly.io)

Database: MongoDB Atlas

Auth: JWT (Access + Refresh tokens)

Storage: Local / Cloud image uploads

Email: SMTP (verification & password reset)

🧰 Tech Stack
Frontend

React (Vite)

Tailwind CSS

Formik + Yup

Fetch API

Material UI Icons

Backend

Node.js

Express.js

MongoDB + Mongoose

JWT Authentication

HTTP-only Cookies

Multer (image uploads)

Nodemailer (email)

Winston (logging)

Helmet & CORS (security)

📁 Project Structure
minieventplanner/
├── client/ # Frontend (Vite + React)
│ ├── src/
│ ├── index.html
│ ├── vite.config.js
│ ├── tailwind.config.js
│ └── package.json
│
├── server/ # Backend (Express)
│ ├── server.js
│ ├── uploads/
│ ├── utils/
│ │ └── logger.js
│ ├── .env.example
│ └── package.json
│
└── README.md

🔐 Authentication & Security

Access Tokens: Short-lived JWT (stored client-side)

Refresh Tokens: Stored as HTTP-only cookies

Refresh tokens are hashed before storing in DB

CORS configured for frontend domain only

Helmet enabled for secure HTTP headers

Secrets stored only in environment variables

🌍 Environment Variables
Backend (server/.env.example)
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:5173

ATLAS_URI=YOUR_MONGODB_URI

ACCESS_SECRET_TOKEN=YOUR_ACCESS_SECRET
REFRESH_SECRET_TOKEN=YOUR_REFRESH_SECRET

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=YOUR_SMTP_PASSWORD

Frontend (client/.env)
VITE_API_URL=http://localhost:5000

⚠️ .env files with real values must never be committed or shared.

▶️ Running Locally
Backend
cd server
npm install
npm run dev

Frontend
cd client
npm install
npm run dev

Frontend runs on: http://localhost:5173
Backend runs on: http://localhost:5000

🚀 Deployment
Frontend (Vercel)

Root Directory: client

Build Command: npm run build

Output Directory: dist

Environment Variable:

VITE_API_URL=https://your-backend-domain.com

Backend (Render / Railway)

Root Directory: server

Start Command:

npm start

Environment Variables: same as .env.example

NODE_ENV=production

🧪 Features Implemented

User Signup & Login

JWT Authentication

Token Refresh Flow

Email Verification

Forgot Password

Event CRUD Operations

Image Uploads

Capacity Management

Protected Routes

Responsive UI

Production Logging

🪵 Logging

Uses Winston instead of console.log

Structured logs

File logging in production

No sensitive data logged

⚠️ Common Issues & Fixes
Issue Solution
CORS error Ensure CLIENT_URL matches frontend domain
Network error Backend must support PUT + multipart
Cookies not set Must use HTTPS + sameSite: "none"
MongoDB URI error URL-encode special characters
📄 License

This project is for educational and demonstration purposes.
