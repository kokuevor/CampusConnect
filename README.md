# CampusConnect - Student Delivery Network

A Next.js application that connects university students for peer-to-peer delivery services.

## Features

- **Student Authentication**: Secure signup/signin with university email verification
- **Delivery Requests**: Students can post delivery requests with pickup/dropoff locations
- **Trip Posting**: Students can post their travel plans and earn money from deliveries
- **Real-time Messaging**: Built-in chat system for coordinating deliveries
- **Review System**: Rate and review completed deliveries
- **User Verification**: Student ID and selfie verification system

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with HTTP-only cookies
- **State Management**: React Context with localStorage persistence

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DB_URI=mongodb://localhost:27017/campusconnect
# For production: mongodb+srv://username:password@cluster.mongodb.net/campusconnect

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Database Setup

Make sure you have MongoDB running locally or use a cloud MongoDB instance.

### 4. Cloudinary Setup

1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from your dashboard
3. Add these credentials to your `.env.local` file

### 5. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Routes

- `POST /api/auth/signup` - User registration with image upload
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user data
- `DELETE /api/images/delete` - Delete image from Cloudinary
- `GET /api/delivery-requests` - Get delivery requests
- `POST /api/delivery-requests` - Create delivery request

## Authentication Flow

1. **Signup**: Students register with university email, student ID, and verification documents
2. **Verification**: Admin reviews student ID and selfie for verification
3. **Signin**: Verified students can sign in and access the platform
4. **Session Management**: JWT tokens stored in HTTP-only cookies for security

## File Structure

```
campusconnect/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/        # Main dashboard
├── components/            # React components
├── lib/                   # Utilities and models
│   ├── models/           # MongoDB models
│   └── auth.ts           # Authentication utilities
└── middleware.ts         # Route protection
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
