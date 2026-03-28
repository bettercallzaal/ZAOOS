'use client'

const colorCache = new Map<string, { r: number; g: number; b: number }>()

export async function extractDominantColor(
  imageUrl: string
): Promise<{ r: number; g: number; b: number }> {
  if (colorCache.has(imageUrl)) return colorCache.get(imageUrl)!

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 50
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)

      const data = ctx.getImageData(0, 0, size, size).data
      let r = 0, g = 0, b = 0, count = 0

      // Sample center 60% of image to avoid edges
      const margin = Math.floor(size * 0.2)
      for (let y = margin; y < size - margin; y++) {
        for (let x = margin; x < size - margin; x++) {
          const i = (y * size + x) * 4
          // Skip very dark and very light pixels
          const brightness = data[i] + data[i + 1] + data[i + 2]
          if (brightness > 30 && brightness < 720) {
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            count++
          }
        }
      }

      if (count === 0) {
        const fallback = { r: 245, g: 166, b: 35 } // gold fallback
        colorCache.set(imageUrl, fallback)
        resolve(fallback)
        return
      }

      const result = {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
      }
      colorCache.set(imageUrl, result)
      resolve(result)
    }

    img.onerror = () => {
      const fallback = { r: 245, g: 166, b: 35 }
      resolve(fallback)
    }

    img.src = imageUrl
  })
}
