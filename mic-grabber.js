const Telebot = require('telebot');
const fs = require('fs');

const bot = new Telebot('API KEY');

bot.on(['audio', 'sticker'], msg => {
  return bot.deleteMessage(msg.chat.id, msg.message_id);
});

bot.on('photo', msg => {
  if (msg.from.id !== 'ID Se Alex mungkin') {
    return bot.deleteMessage(msg.chat.id, msg.message_id);
  }
})

bot.on(['text', 'photo'], msg => {
  if (Object.keys(msg).length) {
    const message = `,
${JSON.stringify(msg)}`

    fs.appendFile('path/to/file.json', message, err => {
      if (err) throw err;
    })

  }
})

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'));

bot.start();
