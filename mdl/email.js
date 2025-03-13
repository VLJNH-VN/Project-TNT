const axios = require('axios');
const cheerio = require('cheerio');

module.exports = (bot) => {
  // Tạo email
  bot.onText(/\/email (\S+) (\S+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1];
    const password = match[2];

    bot.sendMessage(chatId, `🔄 Đang tạo email **${email}@uocnv.com**...`);

    try {
      const response = await axios.post(
        'https://www.uocnv.com/api/',
        new URLSearchParams({
          email: email,
          password: password,
          domain: 'nhatop1.com',
          act: 'createUser',
        }),
        {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'Mozilla/5.0',
          },
        }
      );

      const data = response.data;
      if (data.status === 'success') {
        bot.sendMessage(
          chatId,
          `✅ **Tạo email thành công!**\n📧 **Email:** ${data.email}\n🔑 **Mật khẩu:** ${password}`
        );
      } else {
        bot.sendMessage(chatId, `❌ **Lỗi:** ${data.msg || 'Không thể tạo tài khoản'}`);
      }
    } catch (error) {
      bot.sendMessage(chatId, `🚨 **Lỗi kết nối API:** ${error.message}`);
    }
  });

 bot.onText(/\/inbox (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1];

  bot.sendMessage(chatId, `📩 Đang lấy thư đến của **${email}**...`);

  try {
    const response = await axios.post(
      'https://www.uocnv.com/api/',
      new URLSearchParams({ email: email, act: 'loadInbox' }),
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
          'user-agent': 'Mozilla/5.0',
        },
      }
    );

    const data = response.data;
    if (!data || !data.emails || data.emails.length === 0) {
      bot.sendMessage(chatId, `📭 Không có email nào.`);
      return;
    }

    let messages = data.emails.map((email) => 
      `📨 **Từ:** ${email.from}\n📌 **Chủ đề:** ${email.subject}\n⏳ **Thời gian:** ${email.date}\n🔗 [Xem email](${email.link})`
    );

    bot.sendMessage(chatId, messages.join("\n\n"), { parse_mode: "Markdown" });
  } catch (error) {
    bot.sendMessage(chatId, `🚨 **Lỗi khi lấy dữ liệu:** ${error.message}`);
  }
});
  // Đọc nội dung email
  bot.onText(/\/readmail (\S+) (\S+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const email = match[1];
    const id = match[2];

    bot.sendMessage(chatId, `📬 Đang đọc email **${id}** của **${email}@uocnv.com**...`);

    try {
      const response = await axios.get(`https://www.uocnv.com/read/${email}/${id}`, {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
          'user-agent': 'Mozilla/5.0',
        },
      });

      const $ = cheerio.load(response.data);
      let emails = [];
      let date = "";
      let from = "";
      let subject = "";
      let message = "";

      $("a").each((_, element) => {
        const text = $(element).text().trim();
        if (text.includes("@")) emails.push(text);
      });

      $("td").each((_, element) => {
        const text = $(element).text().trim();
        if (text.includes("Date")) date = $(element).next().text().trim();
        else if (text.includes("From")) from = $(element).next().text().trim();
        else if (text.includes("Subject")) subject = $(element).next().text().trim();
      });

      let messageSet = new Set();
      $("p, span").each((_, element) => {
        const text = $(element).text().trim();
        if (text && !messageSet.has(text)) {
          messageSet.add(text);
        }
      });
      message = Array.from(messageSet).join(" ");

      bot.sendMessage(
        chatId,
        `📧 **Email từ:** ${from}\n📌 **Chủ đề:** ${subject}\n⏳ **Thời gian:** ${date}\n\n📜 **Nội dung:**\n${message}`
      );
    } catch (error) {
      bot.sendMessage(chatId, `🚨 **Lỗi khi lấy dữ liệu:** ${error.message}`);
    }
  });
};