import app from './app'

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`MedFlow API rodando em http://localhost:${PORT}`)
})
