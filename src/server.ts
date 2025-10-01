import express from 'express';
import path from 'path';
import { GameRoutes } from './routes/gameRoutes';
import { AIService } from './services/aiService';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize services
const aiService = new AIService(
    process.env.GENAI_API_KEY || "AIzaSyDIYEflVkSHtK2LKc3P0Fq8qAbwRiulTD0"
);

// Initialize routes
const gameRoutes = new GameRoutes(aiService);
app.use('/api', gameRoutes.getRouter());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Ready to rumble!', 
        timestamp: new Date().toISOString(),
        message: 'Bisaya vs Tagalog server is running!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🥊 Bisaya vs Tagalog server running on port ${PORT}`);
    console.log(`🎮 Game available at: http://localhost:${PORT}`);
    console.log(`💥 Ready to fight?!`);
});