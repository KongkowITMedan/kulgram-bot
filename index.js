require('dotenv').config()

const _ = require('lodash');
const Telebot = require('telebot')
const fs = require('fs')
const log = require('./log.json')

const bot = new Telebot(process.env.API_KEY)
const LOG_DIR = './log.json'

const ask = []
const currentLog = _.clone(log)
let admin = []
let isMute = false

bot.getChatAdministrators(process.env.CHAT_ID)
  .then(response => response.result.forEach(people => admin.push(people.user)))
  .catch(err => console.log(err))

const stringify = (data) => JSON.stringify(data)

function checkAdmin (user) {
  const isAdmin = _.find(admin, ['username', user])
  if (isAdmin) return isAdmin
  if (!isAdmin) bot.sendMessage(process.env.CHAT_ID, `You have no power here @${user}`)
}

function writeLog () {
  fs.writeFile(LOG_DIR, stringify(currentLog), err => {
    if (err) throw err
  })
}

// Hello world!
bot.on(['/hello'], msg => msg.reply.text('Hello World!'))

bot.on(['/mute'], msg => {
  if(isMute) return;
  const isAdmin = checkAdmin(msg.from.username)
  if(isAdmin){
    isMute = true
    bot.sendMessage(process.env.CHAT_ID, `Mode Belajar`)
  }
})

bot.on(['/unmute'], msg => {
  if(!isMute) return;
  const isAdmin = checkAdmin(msg.from.username)
  if(isAdmin){
    isMute = false
    bot.sendMessage(process.env.CHAT_ID, `Mode QA`)
  }
})

// Delete audio & sticker post
bot.on(['audio', 'sticker'], msg => bot.deleteMessage(msg.chat.id, msg.message_id))

// Save photo & text post to .json log
bot.on(['text', 'photo'], msg => {
  if (msg.chat.id.toString() === process.env.CHAT_ID) {
    const isAdmin = checkAdmin(msg.from.username)
    if(isMute && !isAdmin) {
      bot.deleteMessage(msg.chat.id, msg.message_id)
    }else{
      currentLog.push(msg)
      writeLog()
    }
  }
})

// Replace log to edited text
bot.on(['edit'], msg => {
  if (msg.chat.id.toString() === process.env.CHAT_ID) {
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
