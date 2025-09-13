
const cors = require('cors');

// Centralized CORS configuration
const corsOptions = {
  origin: [
    'https://turbo-enigma-frontend.vercel.app',
    'https://turbo-enigma-frontend-bydm.vercel.app',
    'https://turbo-enigma-jw51.vercel.app',
    'https://turbo-enigma.vercel.app',
    'https://turbo-enigma-frontend-sq3h.vercel.app',
    'https://design-center.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://designcenter.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);
