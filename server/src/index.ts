import cors from 'cors';
import express from 'express';
import { env } from './env.js';
import { errorHandler } from './lib/http.js';
import { adminRouter } from './routes/admin.js';
import { publicRouter } from './routes/public.js';

const app = express();

app.use(
  cors({
    // Requests without an Origin (curl, native Capacitor WebView) are allowed;
    // browsers get checked against CORS_ORIGINS.
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ruxsat etilmagan: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

// Next.js also serves this directory at /uploads; this mount lets the future
// Capacitor app fetch the same files straight from the API origin.
app.use('/uploads', express.static(env.uploadDir));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/admin', adminRouter);
app.use('/api', publicRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API http://localhost:${env.port}`);
});
