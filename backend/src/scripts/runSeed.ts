import { execSync } from "child_process";
import path from "path";

const run = (command: string) => {
    console.log(`\n🚀 Running: ${command}`);
    execSync(command, { stdio: "inherit" });
};

// __dirname = src/scripts
const scriptsDir = __dirname;

try {
    // 1. Prisma seed (TS)
    run(`npx ts-node ${path.join(scriptsDir, "seed.ts")}`);

    // 2. Seed products
    run(`npx ts-node ${path.join(scriptsDir, "seedProduct.js")}`);
    // 3. Download images
    run(`node ts-node ${path.join(scriptsDir, "downloadImages.js")}`);

    // 4. Fix broken images
    run(`node ts-node ${path.join(scriptsDir, "fixBrokenImages.js")}`);

    // 5. Seed reviews
    run(`node ts-node ${path.join(scriptsDir, "seedReview.js")}`);

    console.log("\n✅ All seeds executed successfully");
} catch (err) {
    console.error("\n❌ Seed process failed", err);
    process.exit(1);
}