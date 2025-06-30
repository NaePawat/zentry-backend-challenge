# Bacefook - Zentry coding challenge

Hello! This project is a RESTful API for fetching user data, update friends, referrals and reward them with network strength to compete each other in the leaderboard!

## Core Technologies Used

*   **Node.js** with **TypeScript** for the application runtime and language.
*   **Express.js** as the web framework for building the API.
*   **PostgreSQL** as the SQL database to store user and reservation data.
*   **Prisma** as the ORM (Object-Relational Mapper) to interact with the PostgreSQL database.
*   **Zod** for data validation (ensuring input data like emails, dates, etc., are correct).
*   **Docker** and **Docker Compose** for containerizing the application and database, making it easy to set up and run anywhere.
*   **Swagger** for creating an interactive documentation for APIs.

## Getting Started

### What you need

*   **Docker Desktop**: for running the dockerize backend.
*   **Git**: To clone the repository.
*   A **terminal** or command prompt.

### Setup and Running the Application

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/NaePawat/zentry-backend-challenge.git
    cd zentry-backend-challenge/Backend
    ```

2.  **Create a `.env` file at the root of the project:**
    ```env
        PORT=5000
        DATABASE_URL=postgresql://postgres:postgres@postgres:5432/bacefook-zentry-postgres
        POSTGRES_USER=postgres
        POSTGRES_PASSWORD=postgres
        POSTGRES_DB=bacefook-zentry-postgres
    ```

3.  **Build and Run with Docker Compose:**
    Open your terminal in the project's root directory and run:
    ```bash
    docker-compose up --build -d
    ```

    This command will start the PostgreSQL database and the API application containers.

4.  **Apply Database Migrations:**
    Important: To run Prisma migrations, you need to execute the command inside the running API container, because the DATABASE_URL in .env points to the database service by its Docker hostname (postgres).

    To enter the container’s shell, run:
    ```bash
        docker exec -it bacefook-api sh
    ```

    Once inside the container, run the migration:
    ```bash
        npx prisma migrate dev --name initial-setup
    ```

    Exit the container
    ```bash
        exit
    ```

    The application API should now be running and accessible at `http://localhost:3000` (or the `PORT` you set in your `.env` file).

### Cleaning up the data in database

To reset the data for the database container, run:
```bash
npx prisma migrate reset --force
```
Then updating the schema to the database:
```bash
npx prisma db push
```

### Stopping the Application

To stop the application and the database containers:
```bash
docker-compose down
```
To stop and remove the database volume (all data will be lost):
```bash
docker-compose down -v
```

## API Documentation (Swagger)

you can access the API documentation in your browser at:

*   **`http://localhost:3000/docs`** (or `http://localhost:${PORT}/docs` if you have configured a different `PORT` in your `.env` file).

## Testing the API

You can test the API in postman
The base URL for the API is `http://localhost:3000/api` (or `http://localhost:${PORT}/api` if you changed the `PORT` in `.env`).
