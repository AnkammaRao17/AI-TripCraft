const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env'); // Load configurations - reload trigger
require('dotenv').config({ path: dotenvPath });

const logger = require('./utils/logger');
logger.info(`Process CWD: ${process.cwd()}`);
logger.info(`App __dirname: ${__dirname}`);
logger.info(`Dotenv loaded configuration from absolute path: ${dotenvPath}`);
logger.info(`EMAIL_USER Loaded: ${!!process.env.EMAIL_USER}`);
logger.info(`EMAIL_PASS Loaded: ${!!process.env.EMAIL_PASS}`);
logger.info(`✓ Environment Loaded`);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const swaggerDocument = require('../swagger.json');

// Route files
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const destinationRoutes = require('./routes/destinations');
const reviewRoutes = require('./routes/reviews');
const favoriteRoutes = require('./routes/favorites');

// Connect to MongoDB
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // In production, replace with specific frontend URI
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request logging
app.use(morgan('combined', { stream: { write: (message) => logger.http(message.trim()) } }));

// Serve API Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);

// Base route response
app.get('/', (req, res) => {
  res.json({
    name: 'AI TripCraft API',
    status: 'Running',
    documentation: '/api-docs',
  });
});

// Centralized error handler middleware
app.use(errorHandler);

// Choose PORT and boot
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Verify Gmail SMTP Connection on startup
  const nodemailer = require('nodemailer');
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'your_gmail_address@gmail.com') {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT) || 587;
    const secure = process.env.EMAIL_SECURE === 'true';
    const user = process.env.EMAIL_USER.trim().replace(/^['"]|['"]$/g, '');
    const pass = process.env.EMAIL_PASS.trim().replace(/^['"]|['"]$/g, '');
    
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    transporter.verify()
      .then(() => logger.info('✓ Gmail SMTP Ready'))
      .catch((err) => logger.error(`✗ Gmail SMTP Connection Failed: ${err.message}`));
  } else {
    logger.warn('✗ Gmail SMTP not configured in .env (using placeholders or missing).');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
