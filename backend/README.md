# Geo-Based Micro Job Platform — Backend

Production-structured REST API for the Geo-Based Micro Job Platform, built with
Node.js, Express, MongoDB (Mongoose), Socket.io, JWT auth, and Cloudinary.

The platform connects nearby **Business Owners** with **Students** for temporary
micro jobs. It only facilitates discovery, applications, digital agreements, and
mutual payment confirmation — **it never processes payments itself.**

---

## Tech Stack

- **Runtime:** Node.js 18+, Express.js
- **Database:** MongoDB + Mongoose (2dsphere geo indexing)
- **Auth:** JWT (access + refresh tokens), bcrypt password hashing
- **Real-time:** Socket.io (JWT-authenticated sockets, per-user rooms)
- **File storage:** Cloudinary (via Multer memory storage)
- **OTP delivery:** Nodemailer (email), Twilio (phone)
- **Docs:** Swagger UI at `/api-docs`
- **Security:** Helmet, CORS, express-mongo-sanitize, xss-clean, rate limiting

## Architecture

```
src/
├── config/          # DB connection, Cloudinary, Swagger, app-wide constants
├── models/           # Mongoose schemas (User + Student/Business/Admin discriminators, Job, etc.)
├── repositories/      # Data-access layer, isolates Mongoose queries from services
├── services/         # Business logic (auth, OTP, geo-matching, uploads, email/SMS)
├── controllers/       # Thin HTTP handlers — validate input, call services, shape response
├── routes/            # Express routers, one per resource + an aggregator (index.js)
├── middlewares/        # auth (JWT), role-based authorization, error handling, rate limiting, uploads
├── validators/         # express-validator rule chains per resource
├── sockets/           # Socket.io server + real-time notification dispatch
├── data/              # Static job categories + DB seed script
├── app.js             # Express app assembly (middleware + routes)
└── server.js          # HTTP server bootstrap + Socket.io init + graceful shutdown
```

This follows **MVC + Repository + Service** layering:
`Route → Middleware → Validator → Controller → Service → Repository → Model`

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # fill in your MongoDB URI, JWT secrets, Cloudinary, SMTP, Twilio keys
npm run seed            # populates the job categories collection
npm run dev              # starts the API with nodemon on http://localhost:5000
```

API documentation: `http://localhost:5000/api-docs`
Health check: `http://localhost:5000/health`

## Core Flows Implemented

- **Auth:** Email/Phone OTP verification → Student (Aadhaar upload,
  age 18–26 enforced) / Business registration → JWT login, refresh, logout,
  forgot/reset password.
- **Jobs:** Create (Publish/Draft), category → job dependent dropdown data,
  full validation rules from the spec (price range, dates, 5-image limit, etc.),
  nearby-jobs discovery, business job management, admin removal.
- **Geo-matching:** On publish, `job.service.js` queries nearby students via a
  MongoDB `$near` query against a `2dsphere` index (default radius 5 km) and
  dispatches real-time Socket.io notifications + persists them for history/badges.
- **Applications:** Student applies → Business accepts/rejects → Student notified
  in real time → student can withdraw a pending application.
- **Digital Work Agreement:** Auto-generated on acceptance; both parties sign with
  a full-name digital signature; job becomes `active` only once both signatures
  are present.
- **Payment confirmation (not processing):** Both Business and Student submit an
  explicit confirmation statement; job becomes `completed` only once both confirm.
- **Ratings:** Business rates Student (1–5 stars + review) after completion;
  Student's `averageRating` is recalculated automatically via a model hook.
- **Notifications:** Persisted history + unread badge count + real-time push via
  Socket.io (`notification:new` event).
- **Admin:** Dashboard analytics, user listing, document verification,
  suspend/unsuspend accounts, job moderation.

## Notes

- This sandbox has no outbound network access to a MongoDB instance, so live
  end-to-end DB requests were not run here. Every file was verified with
  `node --check` (syntax) and by requiring `app.js` end-to-end (confirms all
  imports/routes/controllers/models resolve with no circular-require or
  typo errors). Connect a real `MONGO_URI` and the API is ready to run.
- Swagger annotations are scaffolded on route files (`tags` blocks); add
  `@swagger` path/operation comments per endpoint as you finalize contracts,
  or generate them from this README's route list.
- Multer enforces a 5 MB per-file limit and validates MIME types
  (jpeg/png/webp/pdf) before anything reaches Cloudinary.
