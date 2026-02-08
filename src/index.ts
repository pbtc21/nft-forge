/**
 * NFT Forge - Generate & Airdrop Unique NFTs
 *
 * Pay via x402 → Generate procedural SVG artwork → Airdrop via cannon
 * Creates SIP-016 compliant metadata for Stacks NFTs
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

interface Env {
  CACHE: KVNamespace;
  PAYMENT_ADDRESS: string;
  AIRDROP_CANNON_URL: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  style: string;
  creator: string;
  supply: number;
  minted: number;
  recipients: string[];
  createdAt: number;
}

// Art generation styles
const STYLES = {
  geometric: { name: "Geometric", description: "Sharp angles and bold shapes" },
  organic: { name: "Organic", description: "Flowing curves and natural forms" },
  pixel: { name: "Pixel", description: "Retro 8-bit aesthetic" },
  circuit: { name: "Circuit", description: "Digital circuitry patterns" },
  stacks: { name: "Stacks", description: "Stacks ecosystem themed" },
  faces: { name: "Bitcoin Faces", description: "Unique faces from bitcoinfaces.xyz" },
};

const BITCOIN_FACES_API = "https://bitcoinfaces.xyz/api";

const PALETTES = [
  ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"], // Vibrant
  ["#2C3E50", "#E74C3C", "#ECF0F1", "#3498DB", "#F39C12"], // Bold
  ["#5c73f2", "#00d9ff", "#ff6b35", "#f7931a", "#9b59b6"], // Stacks
  ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483"], // Dark
  ["#00b894", "#00cec9", "#0984e3", "#6c5ce7", "#fd79a8"], // Neon
];

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// Fetch Bitcoin Face SVG from bitcoinfaces.xyz
async function fetchBitcoinFace(seed: string): Promise<string> {
  try {
    const response = await fetch(`${BITCOIN_FACES_API}/get-svg-code?name=${encodeURIComponent(seed)}`);
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    console.error("Bitcoin Faces API error:", e);
  }
  // Fallback SVG if API fails
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#1a1a2e"/>
    <text x="200" y="200" text-anchor="middle" fill="#f7931a" font-size="24">Bitcoin Face</text>
    <text x="200" y="240" text-anchor="middle" fill="#888" font-size="14">${seed.slice(0, 20)}...</text>
  </svg>`;
}

// Seeded random number generator
function seededRandom(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Hash string to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Generate unique SVG artwork
function generateArt(seed: string, style: string, size: number = 400): string {
  const hash = hashString(seed);
  const rand = seededRandom(hash);
  const palette = PALETTES[Math.floor(rand() * PALETTES.length)];
  const bgColor = palette[Math.floor(rand() * palette.length)];

  let elements = "";

  switch (style) {
    case "geometric":
      elements = generateGeometric(rand, palette, size);
      break;
    case "organic":
      elements = generateOrganic(rand, palette, size);
      break;
    case "pixel":
      elements = generatePixel(rand, palette, size);
      break;
    case "circuit":
      elements = generateCircuit(rand, palette, size);
      break;
    case "stacks":
      elements = generateStacks(rand, palette, size);
      break;
    default:
      elements = generateGeometric(rand, palette, size);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${palette[0]};stop-opacity:0.8"/>
        <stop offset="100%" style="stop-color:${palette[1]};stop-opacity:0.8"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    ${elements}
  </svg>`;
}

function generateGeometric(rand: () => number, palette: string[], size: number): string {
  let svg = "";
  const shapes = 8 + Math.floor(rand() * 12);

  for (let i = 0; i < shapes; i++) {
    const color = palette[Math.floor(rand() * palette.length)];
    const opacity = 0.3 + rand() * 0.5;
    const x = rand() * size;
    const y = rand() * size;

    if (rand() > 0.5) {
      // Triangle
      const s = 30 + rand() * 80;
      const points = `${x},${y - s} ${x - s},${y + s} ${x + s},${y + s}`;
      svg += `<polygon points="${points}" fill="${color}" opacity="${opacity}"/>`;
    } else if (rand() > 0.5) {
      // Rectangle
      const w = 30 + rand() * 100;
      const h = 30 + rand() * 100;
      const angle = rand() * 360;
      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}" transform="rotate(${angle} ${x + w / 2} ${y + h / 2})"/>`;
    } else {
      // Circle
      const r = 20 + rand() * 60;
      svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
    }
  }
  return svg;
}

function generateOrganic(rand: () => number, palette: string[], size: number): string {
  let svg = "";
  const blobs = 5 + Math.floor(rand() * 8);

  for (let i = 0; i < blobs; i++) {
    const color = palette[Math.floor(rand() * palette.length)];
    const opacity = 0.4 + rand() * 0.4;
    const cx = rand() * size;
    const cy = rand() * size;
    const r = 40 + rand() * 100;

    // Create blob with bezier curves
    const points = [];
    const numPoints = 6;
    for (let j = 0; j < numPoints; j++) {
      const angle = (j / numPoints) * Math.PI * 2;
      const variation = 0.7 + rand() * 0.6;
      const px = cx + Math.cos(angle) * r * variation;
      const py = cy + Math.sin(angle) * r * variation;
      points.push({ x: px, y: py });
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let j = 0; j < points.length; j++) {
      const p1 = points[j];
      const p2 = points[(j + 1) % points.length];
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      path += ` Q ${p1.x} ${p1.y} ${mx} ${my}`;
    }
    path += " Z";

    svg += `<path d="${path}" fill="${color}" opacity="${opacity}"/>`;
  }
  return svg;
}

function generatePixel(rand: () => number, palette: string[], size: number): string {
  let svg = "";
  const pixelSize = 20;
  const grid = size / pixelSize;

  for (let x = 0; x < grid; x++) {
    for (let y = 0; y < grid; y++) {
      if (rand() > 0.4) {
        const color = palette[Math.floor(rand() * palette.length)];
        const opacity = 0.6 + rand() * 0.4;
        svg += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}" opacity="${opacity}"/>`;
      }
    }
  }
  return svg;
}

function generateCircuit(rand: () => number, palette: string[], size: number): string {
  let svg = "";
  const lines = 15 + Math.floor(rand() * 20);

  for (let i = 0; i < lines; i++) {
    const color = palette[Math.floor(rand() * palette.length)];
    let x = rand() * size;
    let y = rand() * size;
    let path = `M ${x} ${y}`;

    const segments = 3 + Math.floor(rand() * 5);
    for (let j = 0; j < segments; j++) {
      const dir = Math.floor(rand() * 4);
      const len = 30 + rand() * 80;
      switch (dir) {
        case 0: x += len; break;
        case 1: x -= len; break;
        case 2: y += len; break;
        case 3: y -= len; break;
      }
      path += ` L ${x} ${y}`;
    }

    svg += `<path d="${path}" stroke="${color}" stroke-width="3" fill="none" opacity="0.8"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="6" fill="${color}"/>`;
  }

  // Add nodes
  for (let i = 0; i < 10; i++) {
    const color = palette[Math.floor(rand() * palette.length)];
    const x = rand() * size;
    const y = rand() * size;
    svg += `<circle cx="${x}" cy="${y}" r="${4 + rand() * 8}" fill="${color}" opacity="0.9"/>`;
  }

  return svg;
}

function generateStacks(rand: () => number, palette: string[], size: number): string {
  let svg = "";
  const stacksPalette = ["#5c73f2", "#00d9ff", "#f7931a", "#ffffff", "#1a1a2e"];

  // Bitcoin symbol in center
  const btcSize = 60 + rand() * 40;
  const cx = size / 2;
  const cy = size / 2;

  // Stacks layers
  for (let i = 0; i < 5; i++) {
    const color = stacksPalette[i % stacksPalette.length];
    const layerY = 50 + i * 70;
    const width = 200 + rand() * 100;
    const height = 40 + rand() * 20;
    const x = (size - width) / 2 + (rand() - 0.5) * 40;
    svg += `<rect x="${x}" y="${layerY}" width="${width}" height="${height}" rx="8" fill="${color}" opacity="${0.7 - i * 0.1}"/>`;
  }

  // Bitcoin B
  svg += `<text x="${cx}" y="${cy + 20}" font-family="Arial Black" font-size="${btcSize}" fill="#f7931a" text-anchor="middle" opacity="0.9">₿</text>`;

  // Floating particles
  for (let i = 0; i < 20; i++) {
    const color = stacksPalette[Math.floor(rand() * stacksPalette.length)];
    const x = rand() * size;
    const y = rand() * size;
    const r = 2 + rand() * 6;
    svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${0.3 + rand() * 0.5}"/>`;
  }

  return svg;
}

// Generate traits/attributes from seed
function generateTraits(seed: string, style: string): Array<{ trait_type: string; value: string }> {
  const hash = hashString(seed);
  const rand = seededRandom(hash);

  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
  const backgrounds = ["Sunset", "Midnight", "Ocean", "Forest", "Cosmic"];
  const moods = ["Calm", "Energetic", "Mysterious", "Playful", "Bold"];

  return [
    { trait_type: "Style", value: STYLES[style as keyof typeof STYLES]?.name || style },
    { trait_type: "Rarity", value: rarities[Math.floor(rand() * rarities.length)] },
    { trait_type: "Background", value: backgrounds[Math.floor(rand() * backgrounds.length)] },
    { trait_type: "Mood", value: moods[Math.floor(rand() * moods.length)] },
    { trait_type: "Generation", value: "Genesis" },
  ];
}

// Homepage
app.get("/", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFT Forge - Generate & Airdrop NFTs</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #fff;
      min-height: 100vh;
    }
    .content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 60px 20px;
    }
    h1 {
      font-size: 3.5rem;
      background: linear-gradient(90deg, #f7931a, #ffd93d, #f7931a);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
      animation: shine 3s linear infinite;
    }
    @keyframes shine { to { background-position: 200% center; } }
    .tagline { font-size: 1.4rem; color: #a0a0a0; margin-bottom: 40px; }
    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .preview-card {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.3s;
    }
    .preview-card:hover { transform: translateY(-4px); }
    .preview-card img { width: 100%; aspect-ratio: 1; }
    .preview-card .label {
      padding: 12px;
      text-align: center;
      font-weight: bold;
      color: #f7931a;
    }
    .section {
      background: rgba(255,255,255,0.03);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
    }
    h2 { color: #f7931a; margin-bottom: 20px; }
    .endpoint {
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      font-family: monospace;
    }
    .method { color: #00d9ff; }
    .price { color: #ffd700; float: right; }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(90deg, #f7931a, #ffd93d);
      color: #000;
      font-weight: bold;
      border-radius: 8px;
      text-decoration: none;
      margin: 5px;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="content">
    <h1>NFT Forge</h1>
    <p class="tagline">Generate unique procedural NFTs & airdrop them instantly</p>

    <div class="preview-grid" id="previews"></div>

    <div class="section">
      <h2>How It Works</h2>
      <ol style="color: #a0a0a0; line-height: 2; padding-left: 20px;">
        <li>Choose an art style (Geometric, Organic, Pixel, Circuit, Stacks, Bitcoin Faces)</li>
        <li>Provide recipient addresses for your airdrop</li>
        <li>Pay via x402 (STX or sBTC)</li>
        <li>Unique artwork generated for each recipient</li>
        <li>NFTs distributed via Airdrop Cannon</li>
      </ol>
    </div>

    <div class="section">
      <h2>API Endpoints</h2>
      <div class="endpoint">
        <span class="method">GET</span> /styles
        <span class="price">Free</span>
        <div style="color:#888;font-size:0.85rem;margin-top:8px">Available art styles</div>
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /preview/:style/:seed
        <span class="price">Free</span>
        <div style="color:#888;font-size:0.85rem;margin-top:8px">Preview generated artwork (SVG)</div>
      </div>
      <div class="endpoint">
        <span class="method">POST</span> /forge
        <span class="price">x402</span>
        <div style="color:#888;font-size:0.85rem;margin-top:8px">Create collection & airdrop NFTs</div>
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /collection/:id
        <span class="price">Free</span>
        <div style="color:#888;font-size:0.85rem;margin-top:8px">Collection details</div>
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /metadata/:collectionId/:tokenId
        <span class="price">Free</span>
        <div style="color:#888;font-size:0.85rem;margin-top:8px">SIP-016 token metadata</div>
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /image/:collectionId/:tokenId
        <span class="price">Free</span>
        <div style="color:#888;font-size:0.85rem;margin-top:8px">Token artwork (SVG)</div>
      </div>
    </div>

    <div class="section">
      <h2>Pricing</h2>
      <p style="color: #a0a0a0;">
        <strong style="color:#f7931a">Base fee:</strong> 0.01 STX (100 sats)<br>
        <strong style="color:#f7931a">Per NFT:</strong> 0.001 STX (10 sats)<br><br>
        Example: 100 NFT airdrop = 0.01 + (100 × 0.001) = <strong>0.11 STX</strong>
      </p>
    </div>
  </div>

  <script>
    const styles = ['geometric', 'organic', 'pixel', 'circuit', 'stacks', 'faces'];
    const container = document.getElementById('previews');

    styles.forEach(style => {
      // For faces, use a sample Stacks address
      const seed = style === 'faces'
        ? 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'
        : 'demo-' + Math.random().toString(36).slice(2);
      const label = style === 'faces' ? 'Bitcoin Faces' : style.charAt(0).toUpperCase() + style.slice(1);
      container.innerHTML += \`
        <div class="preview-card">
          <img src="/preview/\${style}/\${seed}" alt="\${style}">
          <div class="label">\${label}</div>
        </div>
      \`;
    });
  </script>
</body>
</html>`;
  return c.html(html);
});

// API info
app.get("/api", (c) => {
  return c.json({
    name: "NFT Forge",
    version: "1.0.0",
    description: "Generate unique procedural NFTs and airdrop them via x402",
    endpoints: {
      "GET /": "Interactive UI",
      "GET /api": "This endpoint",
      "GET /styles": "Available art styles",
      "GET /preview/:style/:seed": "Preview artwork (SVG)",
      "POST /forge": "Create collection & airdrop (x402)",
      "GET /collection/:id": "Collection details",
      "GET /metadata/:collectionId/:tokenId": "SIP-016 metadata",
      "GET /image/:collectionId/:tokenId": "Token artwork",
      "GET /stats": "Platform statistics",
    },
    styles: STYLES,
    pricing: {
      baseFee: "10000 µSTX (0.01 STX)",
      perNft: "1000 µSTX (0.001 STX)",
      example: "100 NFTs = 0.11 STX",
    },
    payment: {
      protocol: "x402",
      accepts: ["STX", "sBTC"],
    },
  });
});

// Available styles
app.get("/styles", (c) => {
  return c.json({
    styles: Object.entries(STYLES).map(([id, info]) => ({
      id,
      ...info,
    })),
  });
});

// Preview artwork
app.get("/preview/:style/:seed", async (c) => {
  const style = c.req.param("style");
  const seed = c.req.param("seed");

  if (!STYLES[style as keyof typeof STYLES]) {
    return c.json({ error: "Invalid style", available: Object.keys(STYLES) }, 400);
  }

  // Special handling for Bitcoin Faces
  if (style === "faces") {
    const svg = await fetchBitcoinFace(seed);
    return c.body(svg, 200, {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    });
  }

  const svg = generateArt(seed, style);
  return c.body(svg, 200, { "Content-Type": "image/svg+xml" });
});

// Forge collection & airdrop
app.post("/forge", async (c) => {
  const paymentTx = c.req.header("X-Payment");

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { name, description, style, recipients } = body;

  // Validate
  if (!name || typeof name !== "string") {
    return c.json({ error: "name is required" }, 400);
  }
  if (!style || !STYLES[style as keyof typeof STYLES]) {
    return c.json({ error: "Invalid style", available: Object.keys(STYLES) }, 400);
  }
  if (!recipients || !Array.isArray(recipients) || recipients.length < 1) {
    return c.json({ error: "recipients array required (min 1)" }, 400);
  }
  if (recipients.length > 10000) {
    return c.json({ error: "Maximum 10000 recipients" }, 400);
  }

  // Validate addresses
  for (const addr of recipients) {
    if (!addr.startsWith("SP") && !addr.startsWith("ST")) {
      return c.json({ error: `Invalid address: ${addr}` }, 400);
    }
  }

  // Calculate price
  const baseFee = 10000; // 0.01 STX
  const perNft = 1000; // 0.001 STX
  const totalCost = baseFee + (recipients.length * perNft);
  const satsCost = Math.ceil(totalCost / 100); // rough conversion

  if (!paymentTx) {
    return c.json(
      {
        error: "Payment required",
        collection: { name, style, recipients: recipients.length },
        pricing: {
          baseFee: (baseFee / 1000000).toFixed(6) + " STX",
          perNft: (perNft / 1000000).toFixed(6) + " STX",
          total: (totalCost / 1000000).toFixed(6) + " STX",
          sats: satsCost,
        },
        instructions: "Include X-Payment header with transaction ID",
      },
      {
        status: 402,
        headers: {
          "X-Payment-Required": "true",
          "X-Payment-Amount": totalCost.toString(),
          "X-Payment-Address": "SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K",
        },
      }
    );
  }

  // Create collection
  const collectionId = crypto.randomUUID().slice(0, 8);

  const collection: Collection = {
    id: collectionId,
    name,
    description: description || `${name} - Generated by NFT Forge`,
    style,
    creator: paymentTx.slice(0, 20),
    supply: recipients.length,
    minted: recipients.length,
    recipients,
    createdAt: Date.now(),
  };

  await c.env.CACHE.put(`collection:${collectionId}`, JSON.stringify(collection), {
    expirationTtl: 86400 * 365, // 1 year
  });

  // Update stats
  const statsData = await c.env.CACHE.get("forge:stats");
  const stats = statsData ? JSON.parse(statsData) : { collections: 0, nftsMinted: 0 };
  stats.collections++;
  stats.nftsMinted += recipients.length;
  await c.env.CACHE.put("forge:stats", JSON.stringify(stats));

  // Call airdrop cannon
  const airdropCannonUrl = c.env.AIRDROP_CANNON_URL || "https://airdrop-cannon.p-d07.workers.dev";

  let airdropResult = null;
  try {
    const response = await fetch(`${airdropCannonUrl}/nft/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: collection.description,
        image: `https://nft-forge.p-d07.workers.dev/image/${collectionId}/1`,
        recipients,
        attributes: generateTraits(collectionId, style),
      }),
    });
    airdropResult = await response.json();
  } catch (e) {
    console.error("Airdrop cannon error:", e);
  }

  return c.json({
    success: true,
    collectionId,
    name,
    style,
    supply: recipients.length,
    payment: { txid: paymentTx },
    metadata: {
      baseUri: `https://nft-forge.p-d07.workers.dev/metadata/${collectionId}/`,
      imageUri: `https://nft-forge.p-d07.workers.dev/image/${collectionId}/`,
    },
    airdrop: airdropResult,
    preview: `/preview/${style}/${collectionId}-1`,
    collection: `/collection/${collectionId}`,
  });
});

// Collection details
app.get("/collection/:id", async (c) => {
  const collectionId = c.req.param("id");
  const data = await c.env.CACHE.get(`collection:${collectionId}`);

  if (!data) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const collection: Collection = JSON.parse(data);

  return c.json({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    style: collection.style,
    creator: collection.creator,
    supply: collection.supply,
    minted: collection.minted,
    createdAt: new Date(collection.createdAt).toISOString(),
    metadata: {
      baseUri: `https://nft-forge.p-d07.workers.dev/metadata/${collection.id}/`,
      imageUri: `https://nft-forge.p-d07.workers.dev/image/${collection.id}/`,
    },
    sampleRecipients: collection.recipients.slice(0, 5),
  });
});

// SIP-016 metadata
app.get("/metadata/:collectionId/:tokenId", async (c) => {
  const collectionId = c.req.param("collectionId");
  const tokenId = c.req.param("tokenId");
  const data = await c.env.CACHE.get(`collection:${collectionId}`);

  if (!data) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const collection: Collection = JSON.parse(data);
  const tokenNum = parseInt(tokenId);

  if (isNaN(tokenNum) || tokenNum < 1 || tokenNum > collection.supply) {
    return c.json({ error: "Invalid token ID" }, 400);
  }

  const seed = `${collectionId}-${tokenId}`;
  const traits = generateTraits(seed, collection.style);

  return c.json({
    sip: 16,
    name: `${collection.name} #${tokenId}`,
    description: collection.description,
    image: `https://nft-forge.p-d07.workers.dev/image/${collectionId}/${tokenId}`,
    attributes: traits,
    properties: {
      collection: collection.name,
      collection_id: collectionId,
      token_id: tokenNum,
      style: collection.style,
    },
  });
});

// Token image
app.get("/image/:collectionId/:tokenId", async (c) => {
  const collectionId = c.req.param("collectionId");
  const tokenId = c.req.param("tokenId");
  const data = await c.env.CACHE.get(`collection:${collectionId}`);

  if (!data) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const collection: Collection = JSON.parse(data);
  const tokenNum = parseInt(tokenId);

  // For Bitcoin Faces, use the recipient's address
  if (collection.style === "faces") {
    const recipientAddress = collection.recipients[tokenNum - 1];
    if (recipientAddress) {
      const svg = await fetchBitcoinFace(recipientAddress);
      return c.body(svg, 200, {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      });
    }
  }

  const seed = `${collectionId}-${tokenId}`;
  const svg = generateArt(seed, collection.style);

  return c.body(svg, 200, { "Content-Type": "image/svg+xml" });
});

// Stats
app.get("/stats", async (c) => {
  const statsData = await c.env.CACHE.get("forge:stats");
  const stats = statsData ? JSON.parse(statsData) : { collections: 0, nftsMinted: 0 };

  return c.json({
    ...stats,
    styles: Object.keys(STYLES).length,
    pricing: {
      baseFee: "0.01 STX",
      perNft: "0.001 STX",
    },
  });
});

// Health
app.get("/health", (c) => {
  return c.json({ status: "forging", timestamp: new Date().toISOString() });
});

export default app;
