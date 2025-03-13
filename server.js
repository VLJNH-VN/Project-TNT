const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const sendAutoDeleteMessage = require('./functions/sendAutoDeleteMessage');
const setupAutoNoti = require('./functions/autonoti');
const sendUptime = require('./functions/uptime');

// Đặt token trực tiếp trong code
const token = "8161840769:AAFb1QNttDcjn_P3ZD12IT_Tto27jdsYRG4";
const adminId = "6602753350";
const groupId = "-1002394487171";

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.static('public'));

// Endpoint uptime
app.get('/uptime', (req, res) => {
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    res.json({ uptime: `${hours} giờ ${minutes} phút ${seconds} giây` });
});

bot.onText(/\/start/, (msg) => {
    sendAutoDeleteMessage(bot, msg.chat.id, 'Xin chào! Tôi là bot của TNT.');
});

sendAutoDeleteMessage(bot, adminId, 'Bot đã khởi động và sẵn sàng hoạt động!');
setupAutoNoti(bot, groupId);

module.exports = app;
