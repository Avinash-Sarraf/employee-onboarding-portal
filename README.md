# Employee Onboarding Portal

A full-stack web application designed to streamline the employee onboarding process by providing a centralized platform for employees and HR teams.

The portal brings together employee registration, profiles, document management, onboarding activities, training, notifications, and communication between employees and HR.

---

## 🚀 Features

### Employee Features

- Employee registration and authentication
- Employee profile management
- Onboarding progress tracking
- Document upload and management
- Training and learning resources
- Notifications and announcements
- HR communication
- Dashboard for onboarding activities

### HR Features

- HR authentication
- HR dashboard
- Employee management
- View employee onboarding progress
- Document verification
- Employee onboarding management
- Training/learning management
- Notifications and announcements
- Employee messaging

### Communication

- Employee ↔ HR communication
- Real-time communication architecture using Socket.IO/WebSockets
- Persistent message storage using MongoDB

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Tailwind CSS
- Axios
- React Router
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication

### Development Tools

- Visual Studio Code
- Git & GitHub
- npm

---

## 📁 Project Structure

```text
project/
│
├── client/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── realtime/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── .gitignore
└── README.md