const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const os = require('os');
const process = require('process');

const sendAutoDeleteMessage = require('./functions/sendAutoDeleteMessage');
const setupAutoNoti = require('./functions/autonoti');
const sendUptime = require('./functions/uptime');

const token = "8161840769:AAFb1QNttDcjn_P3ZD12IT_Tto27jdsYRG4";
const adminId = "6602753350";
const groupId = "-1002394487171";

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.static('public'));

// Thời gian khởi động bot
const startTime = process.uptime();

// Endpoint trả về thời gian uptime
app.get('/uptime', (req, res) => {
    const uptimeSeconds = process.uptime() - startTime;
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    res.json({ uptime: `${hours} giờ ${minutes} phút ${seconds} giây` });
});

// Import module từ "mdl/"
const mdlPath = path.join(__dirname, 'mdl');
fs.readdirSync(mdlPath).forEach((file) => {
    if (file.endsWith('.js')) {
        require(`./mdl/${file}`)(bot, { adminId, groupId });
    }
});

bot.onText(/\/start/, (msg) => {
    sendAutoDeleteMessage(bot, msg.chat.id, 'Xin chào! Tôi là bot của TNT.');
});

bot.onText(/\/uptime/, (msg) => {
    sendUptime(bot, msg.chat.id);
});

sendAutoDeleteMessage(bot, adminId, 'Bot đã khởi động và sẵn sàng hoạt động!');
setupAutoNoti(bot, groupId);

app.listen(3000, () => {
    console.log('Server đang chạy tại http://localhost:3000');
});
