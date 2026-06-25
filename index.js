const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, downloadMediaMessage } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')
const express = require('express')
const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000
const PREFIX = '.'
const BOT_NAME = 'BOSCOV MD'
const OWNER_NUMBER = '2348012345678@s.whatsapp.net' // PUT YOUR NUMBER
const BOT_PIC_URL = 'https://i.ibb.co/4jH6Zzq/boscov.jpg' // PUT YOUR PIC URL

const sessions = new Map()
const SESSIONS_DIR = './sessions'

fs.ensureDirSync(SESSIONS_DIR)
