import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

// Use your actual user and order IDs
const USER_IDS = [16, 17];
const ORDER_IDS = [5, 6];

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

async function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        let isFirstLine = true;
        const rl = readline.createInterface({
            input: createReadStream(filePath, { encoding: 'utf-8' }),
            crlfDelay: Infinity,
        });
        rl.on('line', line => {
            if (isFirstLine) {
                isFirstLine = false;
                return;
            }
            if (line.trim()) rows.push(parseCSVLine(line));
        });
        rl.on('close', () => resolve(rows));
        rl.on('error', reject);
    });
}

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    const csvPath = path.resolve(process.cwd(), 'data', 'productData.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found:', csvPath);
        process.exit(1);
    }

    const rows = await readCSV(csvPath);
    console.log(`Found ${rows.length} rows`);

    let reviewsCreated = 0;
    let reviewErrors = 0;
    const reviewCombos = new Set();

    for (const [i, row] of rows.entries()) {
        const name = (row[0] || '').trim();
        const titlesRaw = (row[6] || '').trim();
        const bodiesRaw = (row[7] || '').trim();
        if (!name) continue;

        const product = await prisma.product.findFirst({
            where: { name },
        });
        if (!product) continue;

        const titles = titlesRaw
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
        const bodies = bodiesRaw
            .split(',')
            .map(b => b.trim())
            .filter(Boolean);
        const count = Math.min(titles.length, bodies.length); // no limit

        if (!count) continue;

        for (let r = 0; r < count; r++) {
            const title = titles[r] || null;
            const body = bodies[r] || null;

            // Pick a unique (userId, orderId) combo
            let userId,
                orderId,
                comboKey,
                attempts = 0;
            do {
                userId = randomFrom(USER_IDS);
                orderId = randomFrom(ORDER_IDS);
                comboKey = `${userId}:${product.id}:${orderId}`;
                attempts++;
            } while (reviewCombos.has(comboKey) && attempts < 20);

            if (reviewCombos.has(comboKey)) continue; // skip if still duplicate
            reviewCombos.add(comboKey);

            const rating = Math.min(5, Math.max(1, Math.round(3 + Math.random() * 2))); // 3-5 stars

            try {
                await prisma.review.upsert({
                    where: {
                        userId_productId_orderId: {
                            userId,
                            productId: product.id,
                            orderId,
                        },
                    },
                    update: { rating, title, body, verified: true, status: 'PUBLISHED' },
                    create: {
                        userId,
                        productId: product.id,
                        orderId,
                        rating,
                        title,
                        body,
                        verified: true,
                        status: 'PUBLISHED',
                    },
                });
                reviewsCreated++;
            } catch (err) {
                reviewErrors++;
                console.error(
                    `Row ${i + 2} review error:`,
                    err instanceof Error ? err.message : String(err),
                );
            }
        }
    }

    console.log(`\nReviews created: ${reviewsCreated}`);
    console.log(`Review errors: ${reviewErrors}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
