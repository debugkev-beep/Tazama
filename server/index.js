import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'tazama-api' })
})

app.get('/api/listings', (_request, response) => {
  response.json({ data: [], message: 'Connect Prisma listing queries here.' })
})

app.post('/api/inquiries', (request, response) => {
  response.status(201).json({ data: request.body, message: 'Inquiry received for seller follow-up.' })
})

app.listen(port, () => {
  console.log(`Tazama API listening on http://localhost:${port}`)
})
