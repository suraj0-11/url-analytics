# URL Analytics Dashboard

A full-stack URL shortener and analytics dashboard built with React, Node.js, and MongoDB.

## Features

- 🔐 User Authentication with JWT
- 🔗 URL Shortening with custom alias support
- 📊 Analytics Dashboard with click tracking
- 📱 Device and browser analytics
- 📈 Time-based click statistics
- 🕒 URL expiration support
- 🎯 QR Code generation
- 🔍 Search and pagination

## Tech Stack

### Frontend
- React.js
- Redux Toolkit
- Recharts for analytics
- TailwindCSS for styling
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- QR Code generation

## Project Structure

```
url-analytics/
├── frontend/           # React frontend application
├── backend/           # Node.js backend API
└── README.md         # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd url-analytics
```

2. Install Backend Dependencies:
```bash
cd backend
npm install
```

3. Install Frontend Dependencies:
```bash
cd frontend
npm install
```

4. Set up environment variables:
Create `.env` files in both frontend and backend directories.

Backend `.env`:
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

Frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5000
```

5. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

## Test Credentials

```
Email: intern@dacoid.com
Password: Test123
```

## API Documentation

### Authentication
- POST /api/auth/login - Login with email and password

### URL Operations
- POST /api/urls - Create short URL
- GET /api/urls - Get all URLs for user
- GET /api/:shortId - Redirect to original URL

### Analytics
- GET /api/analytics/:urlId - Get analytics for specific URL
- GET /api/analytics/dashboard - Get dashboard statistics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 