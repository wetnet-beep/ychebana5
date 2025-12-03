// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// База данных ключей
let keysDatabase = {
    'UCH-NA5-SUN-723': { used: false, user: null, expiry: null },
    'UCH-NA5-MOON-841': { used: false, user: null, expiry: null },
    'UCH-NA5-STAR-309': { used: false, user: null, expiry: null },
    'UCH-NA5-BOOK-456': { used: false, user: null, expiry: null },
    'UCH-NA5-PEN-182': { used: false, user: null, expiry: null },
    'UCH-NA5-DESK-574': { used: false, user: null, expiry: null },
    'UCH-NA5-LAMP-960': { used: false, user: null, expiry: null },
    'UCH-NA5-CODE-235': { used: false, user: null, expiry: null },
    'UCH-NA5-LEARN-618': { used: false, user: null, expiry: null },
    'UCH-NA5-BRAIN-777': { used: false, user: null, expiry: null },
    'UCH-NA5-EXAM-112': { used: false, user: null, expiry: null },
    'UCH-NA5-TEST-889': { used: false, user: null, expiry: null },
    'UCH-NA5-MATH-334': { used: false, user: null, expiry: null },
    'UCH-NA5-FIVE-665': { used: false, user: null, expiry: null },
    'UCH-NA5-PLUS-492': { used: false, user: null, expiry: null },
    'UCH-NA5-MIND-201': { used: false, user: null, expiry: null },
    'UCH-NA5-KNOW-876': { used: false, user: null, expiry: null },
    'UCH-NA5-WISE-143': { used: false, user: null, expiry: null },
    'UCH-NA5-PEAK-550': { used: false, user: null, expiry: null },
    'UCH-NA5-QUIZ-267': { used: false, user: null, expiry: null },
    'UCH-NA5-FACT-718': { used: false, user: null, expiry: null },
    'UCH-NA5-ACE-385': { used: false, user: null, expiry: null },
    'UCH-NA5-GOAL-924': { used: false, user: null, expiry: null },
    'UCH-NA5-HACK-631': { used: false, user: null, expiry: null },
    'UCH-NA5-JAVA-159': { used: false, user: null, expiry: null },
    'UCH-NA5-PYTH-472': { used: false, user: null, expiry: null },
    'UCH-NA5-OPEN-806': { used: false, user: null, expiry: null },
    'UCH-NA5-TECH-290': { used: false, user: null, expiry: null },
    'UCH-NA5-DATA-537': { used: false, user: null, expiry: null },
    'UCH-NA5-USER-764': { used: false, user: null, expiry: null },
    'UCH-NA5-FAST-421': { used: false, user: null, expiry: null },
    'UCH-NA5-EASY-658': { used: false, user: null, expiry: null },
    'UCH-NA5-HELP-995': { used: false, user: null, expiry: null },
    'UCH-NA5-NEXT-120': { used: false, user: null, expiry: null },
    'UCH-NA5-WEST-483': { used: false, user: null, expiry: null },
    'UCH-NA5-FIRE-739': { used: false, user: null, expiry: null },
    'UCH-NA5-WAVE-256': { used: false, user: null, expiry: null },
    'UCH-NA5-ZONE-874': { used: false, user: null, expiry: null },
    'UCH-NA5-EDGE-512': { used: false, user: null, expiry: null },
    'UCH-NA5-ROAD-349': { used: false, user: null, expiry: null }
};

app.post('/api/activate-key', (req, res) => {
    const { key, deviceId } = req.body;
    
    if (!keysDatabase[key]) {
        return res.json({ success: false, error: 'Неверный ключ' });
    }
    
    if (keysDatabase[key].used) {
        return res.json({ success: false, error: 'Ключ уже использован' });
    }
    
    // Активируем ключ
    keysDatabase[key] = {
        used: true,
        user: deviceId,
        expiry: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    };
    
    res.json({ 
        success: true, 
        expiry: keysDatabase[key].expiry 
    });
});

app.get('/api/keys', (req, res) => {
    res.json(keysDatabase);
});

app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
