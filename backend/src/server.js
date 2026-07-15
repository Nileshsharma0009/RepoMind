import 'dotenv/config';
import app from './app.js';
import env, { validateEnv } from './config/env.js';
import ConnectDB from './config/db.js';


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await ConnectDB();

        app.listen(PORT, () => {
            console.log(` Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error(" Error starting server:", error);
        process.exit(1);
    }
}

startServer();