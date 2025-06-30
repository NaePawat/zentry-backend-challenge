import { StartCronJob } from "./cronjob";
import express from "express";
import dotenv from "dotenv";
import usersRoutes from './routes/users';
import leaderboardRoutes from './routes/leaderboard';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swaggerConfig';

dotenv.config();

const app = express()

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Starting servers
app.get('/', (req, res) => {
    res.json({ 
        message: "Bacefook (???) is running!",
        documentation: `API documentation available at http://localhost:${process.env.PORT || 3000}/docs`
    });
});

app.use('/api/users', usersRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}. API docs at http://localhost:${PORT}/docs`);
});

// Start the cron job to generate events
StartCronJob();