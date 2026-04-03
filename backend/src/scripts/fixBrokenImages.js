import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'products', 'images');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const sleep = ms => new Promise(res => setTimeout(res, ms));

function isValidImage(filepath) {
    return fs.existsSync(filepath) && fs.statSync(filepath).size > 2000;
}

function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        const req = client.get(
            url,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'text/html',
                },
            },
            res => {
                if ([301, 302].includes(res.statusCode)) {
                    return fetchHtml(res.headers.location).then(resolve).catch(reject);
                }

                let data = '';
                res.on('data', c => (data += c));
                res.on('end', () => resolve(data));
            },
        );

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function searchBingImage(productName) {
    const queries = [
        productName,
        productName.split(' ').slice(0, 5).join(' '),
        `${productName} product`,
    ];

    for (const q of queries) {
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`;
        const html = await fetchHtml(url);

        const matches =
            html.match(/"murl":"(https:[^"]+)"/g) ||
            html.match(/murl&quot;:&quot;(https:[^&]+?)&quot;/g) ||
            [];

        for (const match of matches) {
            const urlMatch = match.match(/https?:\/\/[^"&]+/);
            if (!urlMatch) continue;

            const img = decodeURIComponent(urlMatch[0]);

            if (
                img.includes('amazon') ||
                img.includes('.svg') ||
                img.includes('icon') ||
                img.includes('data:')
            )
                continue;

            if (img.match(/\.(jpg|jpeg|png|webp)/i)) {
                return img;
            }
        }
    }

    return null;
}

async function downloadImage(url, filename, retries = 2) {
    const filepath = path.join(UPLOAD_DIR, filename);

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await new Promise((resolve, reject) => {
                const client = url.startsWith('https') ? https : http;

                const file = fs.createWriteStream(filepath);

                const req = client.get(
                    url,
                    {
                        headers: {
                            'User-Agent': 'Mozilla/5.0',
                            Referer: 'https://www.bing.com/',
                        },
                    },
                    res => {
                        if ([301, 302].includes(res.statusCode)) {
                            return downloadImage(res.headers.location, filename)
                                .then(resolve)
                                .catch(reject);
                        }

                        if (res.statusCode !== 200) {
                            return reject(new Error(`HTTP ${res.statusCode}`));
                        }

                        res.pipe(file);

                        file.on('finish', () => {
                            file.close();
                            if (!isValidImage(filepath)) {
                                fs.unlinkSync(filepath);
                                return reject(new Error('Invalid image'));
                            }
                            resolve();
                        });
                    },
                );

                req.on('error', reject);
                req.setTimeout(10000, () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });
            });

            return;
        } catch (err) {
            if (attempt === retries) throw err;
            await sleep(1000);
        }
    }
}

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, name: true, image: true },
    });

    const toFix = products.filter(p => {
        if (!p.image) return true;

        if (p.image.startsWith('http')) return true;

        const filepath = path.join(UPLOAD_DIR, path.basename(p.image));
        return !isValidImage(filepath);
    });

    console.log(`🔧 Found ${toFix.length} broken images\n`);

    let fixed = 0;
    let failed = 0;

    for (let i = 0; i < toFix.length; i++) {
        const p = toFix[i];

        try {
            console.log(`[${i + 1}] ${p.name.slice(0, 40)}`);

            const imageUrl = await searchBingImage(p.name);

            if (!imageUrl) {
                console.log('⚠️ Not found');
                failed++;
                continue;
            }

            const filename = `product-${p.id}.jpg`;

            await downloadImage(imageUrl, filename);

            await prisma.product.update({
                where: { id: p.id },
                data: {
                    image: `/uploads/products/images/${filename}`,
                    images: [`/uploads/products/images/${filename}`],
                },
            });

            fixed++;
            console.log('✅ Done');

            await sleep(800);
        } catch (err) {
            failed++;
            console.log('❌ Failed:', err.message);
            await sleep(1500);
        }
    }

    console.log('\n──────── RESULT ────────');
    console.log('Fixed :', fixed);
    console.log('Failed:', failed);
}

main().finally(() => prisma.$disconnect());
