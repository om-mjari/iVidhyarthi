# How to Start the Backend Server

## Step 1: Navigate to Backend Folder
```bash
cd newpracticalRutik/backend
```

## Step 2: Install Dependencies (if not already done)
```bash
npm install
```

## Step 3: Check .env File
Make sure you have a `.env` file in the `backend` folder with:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
```

## Step 4: Start the Server
```bash
npm start
```

Or if you have nodemon installed:
```bash
npm run dev
```

## Step 5: Verify Server is Running
You should see:
```
✅ MongoDB Connected Successfully
✅ GridFS Initialized
✅ All routes registered successfully
   - /api/tbl-courses
   - /api/course-categories
🚀 Server running on port 5000
📡 API Base URL: http://localhost:5000/api
```

## Step 6: Test the Routes
Open in browser:
- Health check: http://localhost:5000/api/health
- Test route: http://localhost:5000/api/tbl-courses/test
- Get courses: http://localhost:5000/api/tbl-courses

## Troubleshooting

### If you see "Route not found":
1. Make sure the server is running (check terminal)
2. Restart the server after adding new routes
3. Check browser console for CORS errors
4. Verify the route is registered in server.js

### If MongoDB connection fails:
1. Check your MONGODB_URI in .env file
2. Make sure MongoDB Atlas allows connections from your IP
3. Verify your MongoDB credentials are correct

