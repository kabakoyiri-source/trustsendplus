const path = require('node:path');
const fs = require('node:fs/promises');
const sharp = require('sharp');

async function main() {
  const publicDir = path.join(__dirname, '../public');
  const shield = path.join(publicDir, 'concept-icon.svg');
  const version = 'v3';

  // Give each revision a new URL so installed apps can fetch the resized artwork.
  const svg = await fs.readFile(shield, 'utf8');
  await fs.writeFile(path.join(publicDir, `concept-icon-${version}.svg`),
    svg.replace('viewBox="0 0 447 447"', 'viewBox="-96 -96 639 639"'));

  for (const size of [180, 192, 512]) {
    const artworkSize = Math.round(size * 0.7);
    const leading = Math.floor((size - artworkSize) / 2);
    const trailing = size - artworkSize - leading;
    const png = await sharp(shield)
      .resize(artworkSize, artworkSize)
      .extend({ top: leading, left: leading, bottom: trailing, right: trailing, background: '#fff' })
      .flatten({ background: '#fff' })
      .png()
      .toBuffer();
    await fs.writeFile(path.join(publicDir, `concept-icon-${size}-${version}.png`), png);
    // Keep old links and the iOS fallback consistent with the current artwork.
    await fs.writeFile(path.join(publicDir, `concept-icon-${size}.png`), png);
    if (size === 180) await fs.writeFile(path.join(publicDir, 'apple-touch-icon.png'), png);
  }
  // Android applies its own mask; extra white space keeps the shield compact.
  const maskableSize = 512;
  const maskableArtwork = Math.round(maskableSize * 0.56);
  const maskableLeading = Math.floor((maskableSize - maskableArtwork) / 2);
  const maskableTrailing = maskableSize - maskableArtwork - maskableLeading;
  await sharp(shield).resize(maskableArtwork, maskableArtwork)
    .extend({top:maskableLeading, left:maskableLeading, bottom:maskableTrailing, right:maskableTrailing, background:'#fff'})
    .flatten({background:'#fff'}).png()
    .toFile(path.join(publicDir, `concept-icon-maskable-${maskableSize}-${version}.png`));
  console.log(`Mobile icons ${version} generated: compact SVG, iOS, Android and maskable.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
