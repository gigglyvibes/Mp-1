// Loaded via Jest's `setupFiles` — runs before the test framework and any
// test file is evaluated, so env vars are in place before `app.js` (and
// anything it requires) is first loaded.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-jwt-refresh-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.BCRYPT_SALT_ROUNDS = "4"; // fast hashing in tests
process.env.CLIENT_URL = "http://localhost:5173";
