const path = require('node:path');
const sharp = require('sharp');

async function main() {
  const publicDir = path.join(__dirname, '../public');
  const shield = path.join(publicDir, 'concept-icon.svg');

  // Leave the same white margin on iOS and Android, as in the mobile reference.
  for (const size of [180, 192, 512]) {
    const artworkSize = Math.round(size * 0.7);
    const leading = Math.floor((size - artworkSize) / 2);
    const trailing = size - artworkSize - leading;
    await sharp(shield)
      .resize(artworkSize, artworkSize)
      .extend({ top: leading, left: leading, bottom: trailing, right: trailing, background: '#fff' })
      .flatten({ background: '#fff' })
      .png()
      .toFile(path.join(publicDir, `concept-icon-${size}.png`));
  }
  console.log('Mobile icons generated with a smaller centered shield.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
