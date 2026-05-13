#!/usr/bin/env node
// Render brand icons from the SVG source into the PNG slots Expo expects.
//
// Run from the repo root: `pnpm --filter @trackpro/mobile icons:generate`
//
// Expects `sharp` to be installed (it already is at the repo root via the
// turbo workspace — we resolve it from the nearest hoisted node_modules).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const ASSETS = resolve(here, '../assets')
const IMAGES = resolve(ASSETS, 'images')

mkdirSync(IMAGES, { recursive: true })

const iconSvg = readFileSync(resolve(ASSETS, 'icon-source.svg'))
const splashSvg = readFileSync(resolve(ASSETS, 'splash-source.svg'))

// `targets` are written from the master SVGs. `density` parameter to sharp
// matters because SVG is vector — we render at the requested pixel size
// directly to avoid rasterization artefacts.
const targets = [
  // iOS + Android app icon (Expo treats this as the primary icon)
  { svg: iconSvg, file: 'icon.png', size: 1024 },
  // Android adaptive icon foreground (transparent surround handled by Expo
  // automatically when the source already encodes the safe zone — our SVG
  // keeps the pin within the inner ~80% so it's safe).
  { svg: iconSvg, file: 'android-icon-foreground.png', size: 1024 },
  // Android adaptive icon monochrome (used by Material You themed icons).
  // We re-use the white pin on transparent — Expo will tint at runtime.
  { svg: iconSvg, file: 'android-icon-monochrome.png', size: 1024, monochrome: true },
  // Web favicon
  { svg: iconSvg, file: 'favicon.png', size: 256 },
  // Splash screen — Expo recommends 2048×2048 for best quality on tablets
  { svg: splashSvg, file: 'splash-icon.png', size: 2048 },
]

for (const target of targets) {
  // SVG density controls intermediate raster resolution. We pick a density
  // such that the SVG viewport (1024 or 2048) renders close to the target
  // size, with a small headroom for clean down-sampling.
  const svgViewport = target.svg === splashSvg ? 2048 : 1024
  const density = Math.min(600, Math.round((target.size / svgViewport) * 96 * 2))
  let pipeline = sharp(target.svg, { density, limitInputPixels: false }).resize(
    target.size,
    target.size,
    { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } },
  )

  if (target.monochrome) {
    // Strip the blue background — keep just the white pin so Android can
    // tint it with the Material You system color.
    pipeline = pipeline.ensureAlpha().removeAlpha().threshold(180).ensureAlpha()
  }

  const buf = await pipeline.png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(resolve(IMAGES, target.file), buf)
  console.log(`wrote ${target.file} (${target.size}px)`)
}

// android-icon-background is a flat blue square — write it directly.
{
  const bg = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 21, g: 101, b: 192, alpha: 1 }, // #1565C0
    },
  })
    .png({ compressionLevel: 9 })
    .toBuffer()
  writeFileSync(resolve(IMAGES, 'android-icon-background.png'), bg)
  console.log('wrote android-icon-background.png (1024px solid #1565C0)')
}
