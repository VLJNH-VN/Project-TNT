const axios = require("axios");

module.exports = (bot) => {
  bot.onText(/\/genshin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const id = match[1]; // Lấy ID từ tin nhắn

    bot.sendMessage(chatId, `🔍 Đang kiểm tra thông tin nhân vật với ID: ${id}...`);

    try {
      const response = await axios.get(`https://genshin.dakgg.io/roles/${id}`);
      const data = response.data;

      if (!data || Object.keys(data).length === 0) {
        bot.sendMessage(chatId, `❌ Không tìm thấy thông tin cho ID: ${id}`);
        return;
      }

      // Ví dụ trả về thông tin cơ bản (có thể thay đổi theo API thực tế)
      const message = `🌟 **Thông tin Nhân vật** 🌟\n
🔹 **ID:** ${id}
🔹 **Tên:** ${data.name || "Không có dữ liệu"}
🔹 **Cấp:** ${data.level || "Không có dữ liệu"}
🔹 **Rank:** ${data.rank || "Không có dữ liệu"}
🔹 **Server:** ${data.server || "Không có dữ liệu"}
      
🔗 [Xem chi tiết](https://genshin.dakgg.io/roles/${id})`;

      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      bot.sendMessage(chatId, `🚨 Lỗi khi lấy dữ liệu: ${error.message}`);
    }
  });
};