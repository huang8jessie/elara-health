const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const tf = require('@tensorflow/tfjs')
const blazeface = require('@tensorflow-models/blazeface')

const SRC = path.join(__dirname, '../public/faces-raw')
const OUT = path.join(__dirname, '../public/faces')
const META_OUT = path.join(__dirname, '../data/faces-meta.json')
const OVERRIDES_PATH = path.join(__dirname, '../data/faces-overrides.json')

fs.mkdirSync(OUT, { recursive: true })

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function normalizePoint(point) {
  if (Array.isArray(point)) return point
  if (point && typeof point.arraySync === 'function') return point.arraySync()
  return [0, 0]
}

function normalizeProbability(probability) {
  if (Array.isArray(probability)) return probability[0] ?? 0
  if (probability && typeof probability.arraySync === 'function') return probability.arraySync()[0] ?? 0
  return Number(probability ?? 0)
}

function loadOverrides() {
  if (!fs.existsSync(OVERRIDES_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'))
  } catch {
    return {}
  }
}

const run = async () => {
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.png'))
  const meta = {}
  const overrides = loadOverrides()
  await tf.ready()
  const model = await blazeface.load()

  for (const file of files) {
    const sourcePath = path.join(SRC, file)
    const outputPath = path.join(OUT, file)
    const { data, info } = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], 'int32')

    let detections = []
    try {
      detections = await model.estimateFaces(tensor, false)
    } finally {
      tensor.dispose()
    }

    const best = detections
      .map((detection) => ({
        detection,
        score: normalizeProbability(detection.probability),
      }))
      .sort((a, b) => b.score - a.score)[0]?.detection

    let cropLeft = 0
    let cropTop = 0
    let cropSize = Math.min(info.width, info.height)
    let autoMeta = { cx: 0.5, cy: 0.4, zoom: 1 }

    if (best) {
      const [x1, y1] = normalizePoint(best.topLeft)
      const [x2, y2] = normalizePoint(best.bottomRight)
      const faceW = Math.max(1, x2 - x1)
      const faceH = Math.max(1, y2 - y1)
      const faceCx = x1 + faceW / 2
      const faceCy = y1 + faceH / 2

      // Safe crop around detected face with margin.
      cropSize = Math.round(clamp(Math.max(faceW, faceH) * 2.0, 64, Math.min(info.width, info.height)))
      cropLeft = Math.round(clamp(faceCx - cropSize / 2, 0, info.width - cropSize))
      cropTop = Math.round(clamp(faceCy - cropSize * 0.42, 0, info.height - cropSize))

      const relCx = clamp((faceCx - cropLeft) / cropSize, 0.2, 0.8)
      const relCy = clamp((faceCy - cropTop) / cropSize, 0.2, 0.75)
      const faceHeightRatio = faceH / cropSize
      const zoom = clamp(0.58 / Math.max(faceHeightRatio, 0.01), 1, 1.2)
      autoMeta = {
        cx: Number(relCx.toFixed(4)),
        cy: Number(relCy.toFixed(4)),
        zoom: Number(zoom.toFixed(4)),
      }
    } else {
      // Fallback: preserve upper portion where face likely appears.
      cropSize = Math.min(info.width, info.height)
      cropLeft = Math.round((info.width - cropSize) / 2)
      cropTop = Math.round(clamp(info.height * 0.05, 0, info.height - cropSize))
      autoMeta = { cx: 0.5, cy: 0.38, zoom: 1 }
    }

    await sharp(sourcePath)
      .extract({ left: cropLeft, top: cropTop, width: cropSize, height: cropSize })
      .resize(128, 128)
      .toFile(outputPath)

    meta[file] = overrides[file] ?? autoMeta
  }

  fs.writeFileSync(META_OUT, `${JSON.stringify(meta, null, 2)}\n`)
  console.log(`Processed ${files.length} face images and wrote ${Object.keys(meta).length} metadata entries.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
