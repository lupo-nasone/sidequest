import Anthropic from '@anthropic-ai/sdk'

export interface AnalysisResult {
  xp: number
  analysis: string
  rating: number
  mediaDescriptions: string[]
}

// XP tiers based on craziness/effort
const XP_BASE = 50
const XP_PER_MEDIA = 25
const XP_CRAZY_BONUS = 200

export async function analyzeSidequest(
  title: string,
  description: string | null,
  imageUrls: string[]
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey || apiKey === 'your_anthropic_api_key') {
    return mockAnalysis(title, description, imageUrls.length)
  }

  const client = new Anthropic({ apiKey, maxRetries: 3 })

  const imageContent: Anthropic.MessageParam['content'] = []

  for (const url of imageUrls.slice(0, 5)) {
    try {
      const res = await fetch(url)
      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const contentType = res.headers.get('content-type') || 'image/jpeg'

      imageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: base64,
        },
      })
    } catch {
      // skip failed images
    }
  }

  const prompt = `Sei il giudice supremo di SideQuest — un social dove le persone registrano avventure reali della vita quotidiana.

Titolo: ${title}
Descrizione: ${description || '(nessuna)'}
${imageContent.length > 0 ? 'Foto allegate: vedi sopra.' : 'Nessuna foto.'}

Il tuo compito è assegnare XP in modo ONESTO e CALIBRATO. Ecco come funziona la scala:

**REGOLA PRINCIPALE:** Gli XP misurano quanto la sidequest è una buona storia da raccontare — cioè quanto è spontanea, folle, fuori dal normale, e memorabile. NON misura il costo economico o quanto suona impressionante a parole.

**Esempi di calibrazione:**
- Andare a dormire sul divano: 10-30 XP
- Mangiare una pizza alle 4 di mattina dopo una serata: 50-80 XP
- Nottata in after/club fino all'alba in una città qualunque: 150-300 XP
- Dormire in un bosco per sopravvivenza/avventura: 200-400 XP
- Fare un viaggio organizzato a Monaco: 80-150 XP (è un viaggio normale, non una sidequest folle)
- Fare autostop fino a Monaco senza soldi: 400-700 XP
- Fare qualcosa di completamente assurdo e documentato: fino a 1000 XP

**Fattori che aumentano gli XP:**
- Spontaneità e improvvisazione (non era pianificato)
- Disagio fisico accettato di buon grado (freddo, fame, stanchezza)
- Situazioni sociali estreme (after, gente mai vista, momenti surreali)
- Unicità del momento ("non succederà mai più")
- Prove fotografiche che confermano la follia

**Fattori che NON aumentano gli XP:**
- Destinazioni famose o costose (Monaco da sola non vale niente)
- Cose pianificate e organizzate
- Attività turistiche standard

Rispondi SOLO con questo JSON (niente altro, zero testo fuori dal JSON):
{
  "xp": <numero intero tra 10 e 1000>,
  "rating": <numero da 1.0 a 10.0 con un decimale — misura il valore epico della storia>,
  "analysis": "<2-3 frasi in italiano, tono da giudice epico/sarcastico, spiega PERCHÉ hai dato quei punti citando elementi specifici della sidequest>",
  "mediaDescriptions": [<una stringa per ogni foto: descrivi cosa vedi e se conferma la sidequest, array vuoto se nessuna foto>]
}`

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: [
        ...imageContent,
        { type: 'text', text: prompt },
      ],
    },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('no json')
    const parsed = JSON.parse(jsonMatch[0])
    return {
      xp: Math.min(1000, Math.max(10, Number(parsed.xp) || XP_BASE)),
      rating: Math.min(10, Math.max(1, Number(parsed.rating) || 5)),
      analysis: parsed.analysis || 'Sidequest completata!',
      mediaDescriptions: Array.isArray(parsed.mediaDescriptions) ? parsed.mediaDescriptions : [],
    }
  } catch {
    return mockAnalysis(title, description, imageUrls.length)
  }
}

function mockAnalysis(title: string, description: string | null, mediaCount: number): AnalysisResult {
  const textLength = (title + (description || '')).length
  const baseXP = XP_BASE + Math.min(textLength * 0.5, 100) + mediaCount * XP_PER_MEDIA
  const crazyWords = ['extreme', 'crazy', 'wild', 'epic', 'insane', 'loco', 'pazzo', 'folle', 'assurdo']
  const isCrazy = crazyWords.some(w => (title + description).toLowerCase().includes(w))
  const xp = Math.round(baseXP + (isCrazy ? XP_CRAZY_BONUS : 0))
  const rating = Math.min(10, 4 + mediaCount + (isCrazy ? 3 : 0))

  return {
    xp: Math.min(1000, xp),
    rating,
    analysis: `[AI non configurata] Sidequest registrata con ${mediaCount} foto. Configura ANTHROPIC_API_KEY per l'analisi completa. XP assegnati in base alla lunghezza della descrizione e al numero di foto.`,
    mediaDescriptions: Array(mediaCount).fill('[Analisi immagine non disponibile - configura ANTHROPIC_API_KEY]'),
  }
}
