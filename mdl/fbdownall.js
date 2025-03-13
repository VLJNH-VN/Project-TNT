/**
 * @command /downfb
 * @category Media
 * @author tnt
 * @date 2025-03-01
 * @usage /downfb
 * @description Tự động tải xuống video fb.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Hàm tải file từ URL
const downloadFile = async (url, folder) => {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const parsedUrl = new URL(url);
    const filepath = path.join(folder, parsedUrl.pathname.split('/').pop() || 'video.mp4');
    const writer = fs.createWriteStream(filepath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filepath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Lỗi khi tải ${url}:`, error.message);
    return null;
  }
};

// Hàm tải video từ Facebook
const downloadFacebookVideo = async (url) => {
  try {
    // Thử API 1
    const api1 = `https://api-rvfi.onrender.com/media/url?url=${encodeURIComponent(url)}`;
    const api1Response = await axios.get(api1);
    const api1Data = api1Response.data;

    if (!api1Data.error && api1Data.medias && api1Data.medias.length > 0) {
      return { data: api1Data, source: 'API1' };
    }

    // Nếu API 1 thất bại, thử API 2 (getvidfb.com)
    console.log('API 1 thất bại, thử API 2...');
    const api2Response = await axios.post(
      'https://getvidfb.com/',
      new URLSearchParams({
        url: url,
        lang: 'en',
        type: 'redirect',
      }),
      {
        headers: {
          'authority': 'getvidfb.com',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'cache-control': 'max-age=0',
          'origin': 'https://getvidfb.com',
          'referer': 'https://getvidfb.com/',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        },
      }
    );

    const $ = cheerio.load(api2Response.data);
    const title = $('h3').text().trim() || 'Không tìm thấy tiêu đề';
    const filteredLinks = [];

    $('a').each((index, element) => {
      const href = $(element).attr('href');
      if (href && (href.startsWith('https://scontent') || href.startsWith('https://video'))) {
        filteredLinks.push(href.replace(/&dl=1(&dl=1)?$/, ''));
      }
    });

    if (filteredLinks.length === 0) {
      throw new Error('Không tìm thấy video từ API 2.');
    }

    return {
      title,
      medias: [{ url: filteredLinks[0], type: 'video', extension: 'mp4' }],
      source: 'API2',
    };
  } catch (error) {
    console.error('Lỗi khi tải video Facebook:', error.message);
    throw error;
  }
};

module.exports = (bot) => {
  // Lắng nghe tin nhắn chứa link Facebook
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Kiểm tra xem tin nhắn có chứa link Facebook không
    const facebookLinkRegex = /^https:\/\/(www\.facebook\.com\/(groups|events|marketplace|watch|share|stories|posts|reel|r|videos|live|gaming)\/|www\.facebook\.com\/[a-zA-Z0-9.]+\/(posts|videos|photos|live|reels)\/|www\.facebook\.com\/share\/v\/[a-zA-Z0-9]+\/|www\.facebook\.com\/permalink\.php\?story_fbid=[0-9]+&id=[0-9]+|www\.facebook\.com\/[a-zA-Z0-9.]+\/?(\?app=fbl)?)/;
    if (!text || !facebookLinkRegex.test(text)) return;

    try {
      // Tạo thư mục tạm
      const outputFolder = path.join(__dirname, 'facebook_video');
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }

      // Tải video từ Facebook
      const videoData = await downloadFacebookVideo(text);

      // Tải video và lưu vào thư mục tạm
      const videoPath = await downloadFile(videoData.medias[0].url, outputFolder);

      // Gửi video trực tiếp vào Telegram
      await bot.sendVideo(chatId, fs.createReadStream(videoPath), {
        caption: `📹 Tiêu đề: ${videoData.title}\n🔗 Nguồn: ${videoData.source}`,
      });

      // Xóa file video sau khi gửi
      fs.unlinkSync(videoPath);
      console.log('Hoàn thành!');
    } catch (error) {
      console.error('Lỗi:', error.message);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi tải video. Vui lòng thử lại.');
    }
  });
};