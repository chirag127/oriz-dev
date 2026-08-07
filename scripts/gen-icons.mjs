import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dir = dirname(fileURLToPath(import.meta.url))
const iconSvg = readFileSync(join(dir, 'icon.svg'))
const maskSvg = readFileSync(join(dir, 'maskable.svg'))

const anySizes = [192, 256, 384, 512]
for (const s of anySizes) {
  await sharp(iconSvg, { density: 384 }).resize(s, s).png().toFile(join(dir, `icon-${s}.png`))
}
await sharp(maskSvg, { density: 384 }).resize(512, 512).png().toFile(join(dir, 'maskable-512.png'))
console.log('icons generated:', [...anySizes.map((s) => `icon-${s}.png`), 'maskable-512.png'].join(', '))
