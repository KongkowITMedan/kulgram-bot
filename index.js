require('dotenv').config()

const Telebot = require('telebot')
const fs = require('fs')
const _ = require('lodash')

// Check for existing of log file. Create new log.json file if isn't exist
const LOG_DIR = './log.json'
if (!fs.existsSync(LOG_DIR)) {
  fs.writeFileSync(LOG_DIR, '[]')
}
const log = require(LOG_DIR)

const bot = new Telebot(process.env.API_KEY)

const ask = []
const currentLog = _.clone(log)
let chatId
let admin = []

const stringify = (data) => JSON.stringify(data)

function checkAdmin (user) {
  const isAdmin = _.find(admin, ['username', user])
  if (isAdmin) return isAdmin
  if (!isAdmin) bot.sendMessage(chatId, `You have no power here @${user}`)
}

function writeLog () {
  fs.writeFile(LOG_DIR, stringify(currentLog), err => {
    if (err) throw err
  })
}

// Hello world!
bot.on(['/hello'], msg => msg.reply.text('Hello World!'))

// On initialize chat
bot.on('/start', msg => {
  chatId = msg.chat.id
  bot.getChatAdministrators(chatId)
    .then((response) => {
      response.result.forEach(people => admin.push(people.user))
    })
    .catch((err) => {
      console.log(err)
    })
  bot.getChat(chatId)
    .then((response) => {
      console.log(response.result)
    })
    .catch((err) => {
      console.log(err)
    })
})

// Delete audio & sticker post
bot.on(['audio', 'sticker'], msg => bot.deleteMessage(msg.chat.id, msg.message_id))

// Save photo & text post to .json log
bot.on(['text', 'photo'], msg => {
  if (msg.chat.id === chatId) {
    currentLog.push(msg)
    writeLog()
  }
})

// Replace log to edited text
bot.on(['edit'], msg => {
  if (msg.chat.id === chatId) {
    const idx = _.findIndex(currentLog, { message_id: msg.message_id })
    _.update(currentLog, idx, () => msg)
    writeLog()
  }
})

// Add to Ask queue
bot.on(['/ask'], msg => {
  ask.push({ name: msg.from.username, done: false })
  msg.reply.text(`@${msg.from.username} added to ask queue, pls wait your turn...`)
})

// Next question pls
bot.on(['/next'], msg => {
  let index
  const isAdmin = checkAdmin(msg.from.username)

  if (isAdmin) {
    const asker = _.find(ask, ['done', false])

    if (asker) {
      index = _.findIndex(ask, {'name': asker.name, 'done': false})
      msg.reply.text(`Please state your question @${asker.name}`)
      ask[index].done = true
    }

    if (!asker) msg.reply.text(`No asker in queue...`)
  }
})

bot.start()
