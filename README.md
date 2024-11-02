# ImageScholar
A web application for extracting and analyzing images from PDF documents using AI technology.
Features

User authentication with JWT
PDF image extraction
AI-powered image analysis using OpenAI's GPT-4
Advanced search with multiple filters
Data visualization with interactive histograms
User profile management
Real-time file upload tracking
Document and image storage using MongoDB GridFS

**Tech Stack**
Frontend

React
JavaScript/TypeScript

Backend

Python (Flask)
MongoDB with GridFS
JWT Authentication
OpenAI API

**Prerequisites**
MongoDB Setup

Download and install MongoDB Compass
Create a new connection using the default URI: mongodb://localhost:27017

Email Server (SMTP) Setup

Configure your .env file with SMTP credentials:
EMAIL_SERVER=smtp.gmail.com  # for Gmail
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

For Gmail:

Go to Google Account Settings
Enable 2-Step Verification
Create an App Password:

Go to Security
Select App Passwords
Generate a new app password
Use this password in your .env file


OpenAI API Key

Visit OpenAI Platform
Create an account or sign in
Navigate to API Keys section
Generate a new API key
Add to your .env file:
OPENAI_API_KEY=your-api-key-here

Image Storage Setup

Create a directory where you want to store uploaded images
Update the image_path variable in the upload function:


Windows: image_path = "C:\\Users\\YourName\\ImageScholar\\images"
Mac/Linux: image_path = "/Users/YourName/ImageScholar/images"

**Installation and Setup
Backend Setup**

Clone the repository
Create and activate virtual environment:

Install dependencies:

Create .env file with required environment variables

**Frontend Setup**

Navigate to frontend directory
Install dependencies:

npm install

**Running the Application**
python app.py
The server will start at http://localhost:5000

**Frontend**
npm start
The application will start at http://localhost:3000
After the initial start, use npm run dev

**Environment Variables Template**
Create a .env file with the following structure:
EMAIL_SERVER=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key

**Important Notes**
Make sure MongoDB is running before starting the application
Ensure all environmental variables are properly set
The image storage directory must have write permissions
Frontend and backend must be running simultaneously for full functionality
Make sure you have Node.js and npm installed for frontend development
