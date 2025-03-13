const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const token = "8161840769:AAFb1QNttDcjn_P3ZD12IT_Tto27jdsYRG4";
const bot = new TelegramBot(token, { webHook: { port: 3000 } });

const app = express();
app.use(express.json());

// Thiết lập webhook (Thay YOUR-VERCEL-URL bằng URL thực tế của bạn)
const WEBHOOK_URL = "https://project-tnt.vercel.app/";
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

// Route nhận tin nhắn từ Telegram
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Route kiểm tra uptime
app.get('/uptime', (req, res) => {
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    res.json({ uptime: `${hours} giờ ${minutes} phút ${seconds} giây` });
});

// Lắng nghe lệnh từ Telegram
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Xin chào! Tôi là bot của TNT.');
});

// Export app để chạy trên Vercel
module.exports = app;
