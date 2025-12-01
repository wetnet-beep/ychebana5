// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// База данных ключей
let keysDatabase = {
    'UCH-NA5-SUN-723': { used: false, user: null, expiry: null },
    // ... остальные ключи
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

app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
