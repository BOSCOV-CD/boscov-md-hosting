const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, downloadMediaMessage } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const express = require('express')
const fs = require('fs-extra')
const path = require('path')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const axios = require('axios')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000
const PREFIX = '.'
const BOT_NAME = 'BOSCOV MD'
const OWNER_NUMBER = '2349033758973@s.whatsapp.net' // BOSCOV
const BOT_PIC_URL = 'https://i.ibb.co/zT5Z3DYF/IMG-20260616-130201-251.jpg'

const sessions = new Map()
const SESSIONS_DIR = './sessions'
// fs.removeSync(SESSIONS_DIR) // COMMENTED 
fs.ensureDirSync(SESSIONS_DIR)

async function startBOSCOV(ownerNumber) {
 25  const sessionPath = path.join(SESSIONS_DIR, ownerNumber)
    
    if (fs.existsSync(sessionPath)) {
        console.log('✅ Using existing session for', ownerNumber)
    } else {
        console.log('🆕 Creating new session for', ownerNumber)
    }
    
27  fs.ensureDirSync(sessionPath)
28  console.log('✅ Starting session for', ownerNumber)  
    console.log('✅ Starting session for', ownerNumber)
   // console.log('🗑️ Deleted old session for', ownerNumber)
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        auth: state,
        getMessage: async () => ({ conversation: 'BOSCOV MD' })
    })

    sessions.set(ownerNumber, sock)
    sock.ev.on('creds.update', saveCreds)

      sock.ev.on('connection.update', async (update) => {
       const { connection, lastDisconnect, qr } = update
       
       if(qr) {
           console.log('📱 OWNER QR CODE - Scan for ' + ownerNumber + ':')
           qrcode.generate(qr, {small: true})
       }
       
       if (connection === 'close') {
           const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
           console.log('Connection closed. Reconnecting:', shouldReconnect)
           
           if (shouldReconnect) {
               console.log('🗑️  Deleted old session for ' + ownerNumber)
               startBOSCOV(ownerNumber)
           } else {
               console.log('❌ Logged out. Delete session and scan QR again.')
           }
       } else if (connection === 'open') {
           console.log(`✅ BOSCOV MD session ${ownerNumber} is ONLINE!`)
       }
   })

sock.ev.on('creds.update', saveCreds)

sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const sender = m.key.remoteJid
        const isGroup = sender.endsWith('@g.us')
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ''

        if (!text.startsWith(PREFIX)) return

        const command = text.slice(PREFIX.length).trim().split(' ')[0].toLowerCase()
        const args = text.slice(PREFIX.length).trim().split(' ').slice(1)

        if (sender!== ownerNumber &&!isGroup) return

        console.log(`[${ownerNumber}] CMD: ${command} from ${sender}`)

        if (command === 'menu' || command === 'help') {
            const menuText = `*🤖 ${BOT_NAME} - PHASE 1 ONLINE*\n\n` +
                           `*OWNER:* ${ownerNumber.split('@')[0]}\n` +
                           `*PREFIX:* ${PREFIX}\n\n` +
                           `*📋 OWNER COMMANDS:*\n` +
                           `• ${PREFIX}menu - Show this menu\n` +
                           `• ${PREFIX}ping - Check if bot is alive\n` +
                           `• ${PREFIX}test - Test command\n\n` +
                           `*🔥 BOSCOV MD BY BOSCOV*\n` +
                           `*Phase 2 coming soon...*`

            await sock.sendMessage(sender, {
                image: { url: BOT_PIC_URL },
                caption: menuText
            })
        }

        if (command === 'ping') {
            const start = Date.now()
            await sock.sendMessage(sender, { text: '🏓 Pinging...' })
            const end = Date.now()
            await sock.sendMessage(sender, { text: `🏓 Pong! ${end - start}ms\n\n✅ BOSCOV MD is alive!` })
        }

        if (command === 'test') {
            await sock.sendMessage(sender, {
                text: `*✅ TEST SUCCESSFUL*\n\n*Bot:* ${BOT_NAME}\n*Owner:* ${ownerNumber.split('@')[0]}\n*Status:* Online\n*Time:* ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}\n\n🔥 BOSCOV MD WORKS!`
            })
        }
    })
}

app.get('/', (req, res) => {
    res.send(`${BOT_NAME} IS ALIVE - Owner: ${OWNER_NUMBER.split('@')[0]}`)
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log('BOSCOV MD INITIALIZED.')
    startBOSCOV(OWNER_NUMBER)
})
