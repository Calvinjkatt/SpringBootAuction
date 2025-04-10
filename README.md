# Bidly - Auction System
Bidly is a full-stack auction platform where users can register, log in, sell, buy and bid on auctioned items. 
This repository contains the core components for the entire system, including both the backend (Spring Boot) and frontend (React + Vite).

## How to run Bidly

### Hard Requirements
#### This Project Requires the following dependencies in order to work:
- **Java 21+** (required for Springboot)
- **Maven** (for managing backend dependencies)
- **PostgreSQL** (required dependency for pgAdmin 4)
- **pgAdmin 4** (required for database control)
- **Node.js & npm** (important to start the frontend)
If you are missing these dependencies you must install them from their appropriate sources

## Setting Up Bidly
It is required to follow these steps to properly be able to run Bidly. Ignoring these steps will result in unexpected errors at best, or completely be unable to use Bidly at worst.

### Database Setup 

1. Start **PostgreSQL** and ensure it's running.
2. Set up your **PostgreSQL username and password at /backend/src/main/resources/application.properties**:
   - The default username is **`postgres`**.
   - Ensure you have a database created by the name of **AuctionDB** for the project.
3. The application will automatically execute the data.sql file located at **/backend/src/main/resources/data.sql** to populate initial database entries when the backend starts.

**WARNING:** Not starting the database will prevent you from being able to login or register a new account, making you unable to use Bidly.

### Backend Setup (Spring Boot)
** You will need to run a new Shell/CMD/WSL/Command-Line Window to execute these functions**

**1. Navigate to the `backend` folder:**
   ```sh
   cd <path-to-your-bidly-installation>/Bidly/backend
   ```
**2. Build and run the Spring Boot application:**
   ```sh
   mvn spring-boot:run
   ```
   This will start the backend server on port 8080.
   *Note make sure there is no other program using this port, or the system will fail to launch the database, causing you to be unable to login into Bidly.*


### Frontend Setup (React + Vite)
** You will need to run a new Shell/CMD/WSL/Command-Line Window to execute these functions**

**1. Navigate to the frontend folder:**

   ```sh
   cd <path-to-your-bidly-installation>/Bidly/frontend
   ```

**2. Install dependencies (first time only):**

   ```sh
   npm install
   ```

**3. Start the frontend:**

   ```sh
   npm run dev
   ```

This will launch the frontend on Vite’s default port (5173).

---

## 🐳 Docker Deployment (For TA Testing & Cloud Readiness)

The backend service is containerized and published to Docker Hub for easy deployment and testing.

### 🔗 Docker Hub Image
**Backend:** [`alisina97/auction-backend`](https://hub.docker.com/r/alisina97/auction-backend)

### 🧪 How to Run the Backend with Docker

   ```sh
   docker pull alisina97/auction-backend
   docker run -p 8080:8080 alisina97/auction-backend
   ```
      
Then visit: http://localhost:8080

❗ Notes:
- Make sure your PostgreSQL database is running and accessible.
- This Docker image only includes the backend — if you'd like help Dockerizing the frontend too or using docker-compose, let us know.

### Running the Application

After the appropriate setups are done, Bidly is ready for the user to use.

#### You can access the pages for Bidly using these addresses
- **Backend:+** Runs on http://localhost:8080
- **Frontend:+** Runs on http://localhost:5173
- Ensure **CORS is properly configured** in the backend so the frontend can communicate with the API.
