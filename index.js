require('dotenv').config()

const _ = require('lodash');
const Telebot = require('telebot')
const fs = require('fs')
const log = require('./log.json')
const bot = new Telebot(process.env.API_KEY)
const ask = []
let admin = []

bot.getChatAdministrators(process.env.CHAT_ID)
  .then(response => response.result.forEach(people => admin.push(people.user)))
  .catch(err => console.log(err))

function checkAdmin (user) {
  const isAdmin = _.find(admin, ['username', user])
  if (isAdmin) return isAdmin
  if (!isAdmin) bot.sendMessage(process.env.CHAT_ID, `You have no power here @${user}`)
}

// Hello world!
bot.on(['/hello'], msg => msg.reply.text('Hello World!'))

// Delete audio & sticker post
bot.on(['audio', 'sticker'], msg => bot.deleteMessage(msg.chat.id, msg.message_id))

// Save photo & text post to .json log
bot.on(['text', 'photo'], msg => {
  if (msg.chat.id == process.env.CHAT_ID) {
    log.push(msg)
    fs.writeFile('./log.json', JSON.stringify(log), err => { if (err) throw err })
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
