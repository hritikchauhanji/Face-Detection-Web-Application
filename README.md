# Face Detection Web App (MERN Stack)

A full-stack web application for authenticated face detection and user image history. Users can register, log in, upload images, run face detection (either frontend with face-api.js or backend using OpenCV), and manage their upload history.

## Features
- User registration and login with JWT authentication
- Upload images and run face detection (frontend or backend)
- History page to view, delete, or download image detection results
- Uses Cloudinary for image storage and MongoDB Atlas for data persistence
- Responsive React frontend with Material UI and Tailwind CSS
- Dockerized backend, ready for cloud deployment

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Material UI, face-api.js, react-router, react-toastify
- **Backend:** Node.js, Express, Mongoose, JWT, bcrypt, multer, Cloudinary, OpenCV (opencv4nodejs)

## Quick Start

### Backend
1. Clone the repository and navigate to the backend folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (see `.env.sample`) and set your MongoDB URI, JWT secrets, and Cloudinary credentials
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend
1. Navigate to the frontend folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file for frontend API endpoint settings
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints (Backend)
- `POST /apiv1/auth/register` - Register new user
- `POST /apiv1/auth/login` - Login and get JWT
- `POST /apiv1/auth/logout` - Logout user
- `POST /apiv1/auth/refresh-token` - Refresh JWT token
- `POST /apiv1/face/upload` - Upload image and detect faces (frontend)
- `POST /apiv1/face/upload-faces-opencv` - Upload image and detect faces (backend OpenCV)
- `GET /apiv1/face/history` - Get user upload history
- `DELETE /apiv1/face/delete/:id` - Delete an uploaded image

## Deployment
- Backend can be deployed with Docker or any Node server
- Frontend can be hosted on Vercel, Netlify, or any static site host

## License
MIT
