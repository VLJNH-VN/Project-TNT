const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const sendAutoDeleteMessage = require('./functions/sendAutoDeleteMessage');
const setupAutoNoti = require('./functions/autonoti');
const sendUptime = require('./functions/uptime');

const token = "8161840769:AAFb1QNttDcjn_P3ZD12IT_Tto27jdsYRG4";
const adminId = "6602753350";
const groupId = "-1002394487171";

const bot = new TelegramBot(token, { webHook: true });

const app = express();
app.use(express.json());

// Lấy URL của Vercel (thay YOUR-VERCEL-URL bằng URL thực tế của bạn)
const WEBHOOK_URL = "https://project-tnt.vercel.app";
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

// Route nhận tin nhắn từ Telegram
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Route uptime
app.get('/uptime', (req, res) => {
    sendUptime(bot, adminId);
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    res.json({ uptime: `${hours} giờ ${minutes} phút ${seconds} giây` });
});

// **Tự động import tất cả module trong thư mục "mdl/"**
const importModules = (dir) => {
    try {
        const mdlPath = path.join(__dirname, dir);
        if (!fs.existsSync(mdlPath)) {
            console.warn(`Thư mục '${dir}/' không tồn tại, bỏ qua việc import module.`);
            return;
        }

        fs.readdirSync(mdlPath).forEach((file) => {
            if (file.endsWith('.js')) {
                try {
                    const modulePath = `./${dir}/${file}`;
                    require(modulePath)(bot, { adminId, groupId });
                    console.log(`✅ Đã load module: ${file}`);
                } catch (err) {
                    console.error(`❌ Lỗi khi load module ${file}:`, err);
                }
            }
        });
    } catch (err) {
        console.error(`❌ Lỗi khi load thư mục '${dir}/':`, err);
    }
};

// Gọi hàm import cho thư mục `mdl/`
importModules('mdl');

// Lắng nghe lệnh từ Telegram
bot.onText(/\/start/, (msg) => {
    sendAutoDeleteMessage(bot, msg.chat.id, 'Xin chào! Tôi là bot của TNT.');
});

bot.onText(/\/uptime/, (msg) => {
    sendUptime(bot, msg.chat.id);
});

// Gửi thông báo khi bot khởi động
sendAutoDeleteMessage(bot, adminId, 'Bot đã khởi động và sẵn sàng hoạt động!');
setupAutoNoti(bot, groupId);

// Export app để chạy trên Vercel
module.exports = app;
