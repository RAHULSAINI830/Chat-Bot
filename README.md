# ChatBot Project

## Overview
This project is a fully functional chatbot system designed to assist users and facilitate real-time communication between users and admins. The chatbot system is built with the following features:

- Real-time messaging with user and admin roles.
- Integration with MongoDB for storing chat and visitor information.
- Visitor information tracking including IP, location, device, and browser.
- Analytics dashboard for monitoring chat statistics.
- Admin panel to manage chats, block users, and mark issues as resolved.

## Features

1. **Real-Time Chat**
   - Built using `socket.io` to enable live communication.
   - Supports both user and admin roles.

2. **Visitor Tracking**
   - Captures IP, location, browser, and device details using `ipinfo.io` API.
   - Stores visitor details in MongoDB.

3. **Admin Dashboard**
   - View active chats and messages.
   - Monitor visitor information in a dedicated panel.
   - Block users or delete chats.
   - Analytics for total messages, active users, and resolved issues.

4. **Analytics Panel**
   - Displays metrics for total messages, active users, and resolved issues.

5. **Database Integration**
   - MongoDB is used to store chat messages and visitor details.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-Time Communication**: Socket.IO
- **Visitor Tracking**: Node-Fetch, IPInfo API

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB Atlas account
- IPInfo API token
- Render or Vercel account for deployment (optional)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/RAHULSAINI830/Chat-Bot.git
   cd Chat-Bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```env
   MONGO_URI=mongodb+srv://Rahul:Rahul%40830@cluster0.npsyl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&ssl=true
   IPINFO_API_KEY=your_ipinfo_api_key
   PORT=3000
   ```

4. Run the application:
   ```bash
   npm start
   ```

5. Access the application:
   - Chatbot: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3000/admin`

## Deployment

This project can be deployed on platforms like Render, Vercel, or any Node.js-compatible hosting service.

### Deployment Steps on Render

1. Create a new web service in Render.
2. Connect the GitHub repository.
3. Set environment variables in the Render dashboard:
   - `MONGO_URI`
   - `IPINFO_API_KEY`
   - `PORT`
4. Build and deploy.

## References

- [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- [IPInfo API](https://ipinfo.io/)
- [Node.js Documentation](https://nodejs.org/)
- [Socket.IO Documentation](https://socket.io/)
- [Render Deployment Docs](https://render.com/docs)

## Features to Explore

1. **Extending Analytics**
   - Add detailed insights like average response time.
   - Track unresolved chats.

2. **Custom Themes**
   - Add support for light/dark mode in the admin panel.

3. **User Authentication**
   - Enable login for admins and users.

4. **Chatbot Intelligence**
   - Integrate with an NLP service (e.g., Dialogflow or OpenAI GPT) for smarter responses.

## Contribution

Feel free to fork this repository and contribute by creating pull requests. For major changes, please open an issue first to discuss the changes.

## License

This project is licensed under the MIT License.

