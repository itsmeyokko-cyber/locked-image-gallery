const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.GALLERY_PASSWORD || "0016";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me-in-production";

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const UPLOADS = path.join(ROOT, "uploads");

if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8
  }
}));

function requireAuth(req, res, next) {
  if (req.session.authenticated) return next();
  return res.status(401).json({ error: "Authentication required." });
}

function requirePageAuth(req, res, next) {
  if (req.session.authenticated) return next();
  return res.redirect("/");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "image";
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  }
});

app.post("/api/login", (req, res) => {
  const password = String(req.body.password || "");
  if (password === PASSWORD) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Incorrect password." });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/session", (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

app.get("/api/images", requireAuth, (_req, res) => {
  const allowed = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
  const images = fs.readdirSync(UPLOADS)
    .filter(name => allowed.has(path.extname(name).toLowerCase()))
    .map(name => {
      const stat = fs.statSync(path.join(UPLOADS, name));
      return {
        name,
        url: `/protected-images/${encodeURIComponent(name)}`,
        uploadedAt: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  res.json(images);
});

// Images themselves are protected; knowing the URL is not enough.
app.get("/protected-images/:name", requireAuth, (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(UPLOADS, name);
  if (!fs.existsSync(file)) return res.sendStatus(404);
  res.sendFile(file);
});

app.post("/api/upload", requireAuth, upload.array("images", 20), (req, res) => {
  res.json({
    ok: true,
    uploaded: (req.files || []).map(f => f.filename)
  });
});

app.delete("/api/images/:name", requireAuth, (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(UPLOADS, name);

  if (!fs.existsSync(file)) return res.sendStatus(404);
  fs.unlinkSync(file);
  res.json({ ok: true });
});

app.use(express.static(PUBLIC));

app.get("/gallery.html", requirePageAuth, (_req, res) => {
  res.sendFile(path.join(PUBLIC, "gallery.html"));
});

app.get("/admin.html", requirePageAuth, (_req, res) => {
  res.sendFile(path.join(PUBLIC, "admin.html"));
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "Upload failed." });
});

app.listen(PORT, () => {
  console.log(`Locked image gallery running at http://localhost:${PORT}`);
});