import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = await readFile(join(root, "public", "logo-mark.svg"));

async function renderPng(relativePath, size, options = {}) {
  const outputPath = join(root, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });

  let image = sharp(source).resize(size, size, { fit: "contain" });
  if (options.background) image = image.flatten({ background: options.background });
  await image.png({ compressionLevel: 9, palette: true }).toFile(outputPath);
}

function createIco(pngs, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  const directory = Buffer.alloc(16 * pngs.length);
  let offset = header.length + directory.length;

  pngs.forEach((png, index) => {
    const entry = index * 16;
    directory[entry] = sizes[index] === 256 ? 0 : sizes[index];
    directory[entry + 1] = sizes[index] === 256 ? 0 : sizes[index];
    directory[entry + 2] = 0;
    directory[entry + 3] = 0;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });

  return Buffer.concat([header, directory, ...pngs]);
}

await Promise.all([
  renderPng(join("app", "icon.png"), 512),
  renderPng(join("app", "apple-icon.png"), 180, { background: "#f1efe8" }),
  renderPng(join("public", "icons", "icon-192.png"), 192),
  renderPng(join("public", "icons", "icon-512.png"), 512),
]);

const maskableMark = await sharp(source)
  .resize(360, 360, { fit: "contain" })
  .png()
  .toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: "#c7ff3c",
  },
})
  .composite([{ input: maskableMark, left: 76, top: 76 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(join(root, "public", "icons", "icon-maskable-512.png"));

const faviconSizes = [16, 32, 48];
const faviconPngs = await Promise.all(
  faviconSizes.map((size) =>
    sharp(source)
      .resize(size, size, { fit: "contain" })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer(),
  ),
);
await writeFile(
  join(root, "app", "favicon.ico"),
  createIco(faviconPngs, faviconSizes),
);

