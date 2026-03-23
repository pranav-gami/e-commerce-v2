import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ── Load JSON files ──
const dataDir = path.join(__dirname, "..", "data");

const allCountries = JSON.parse(
  fs.readFileSync(path.join(dataDir, "countries.json"), "utf-8"),
);
const allStates = JSON.parse(
  fs.readFileSync(path.join(dataDir, "states.json"), "utf-8"),
);
const allCities = JSON.parse(
  fs.readFileSync(path.join(dataDir, "cities.json"), "utf-8"),
);

// ── Only seed cities for these country ISO codes ──
const SEED_CITIES_FOR_ISO = ["IN"];

// ============================================================
//  STEP 1 — Clear all existing data
// ============================================================
async function clearData(): Promise<void> {
  console.log("🗑️  Clearing existing data...");
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();
  await prisma.country.deleteMany();
  await prisma.heroSlide.deleteMany();
  await prisma.pendingVerification.deleteMany();
  console.log(" Cleared\n");
}

// ============================================================
//  STEP 2 — Seed Countries
// ============================================================
async function seedCountries(): Promise<void> {
  console.log(`📦 Seeding ${allCountries.length} countries...`);

  const data = allCountries.map((c: any) => ({
    name: c.name,
    isoCode: c.iso2,
    //  Correct field name
    phoneCode: c.phonecode ? `+${c.phonecode}` : null,
    flag: c.emoji ?? null,
    currency: c.currency ?? null,
  }));

  await prisma.country.createMany({ data, skipDuplicates: true });
  console.log(` ${data.length} countries seeded`);
}

// ============================================================
//  STEP 3 — Seed States
//  JSON fields: iso2 (state code), country_code, name
// ============================================================
async function seedStates(): Promise<void> {
  console.log(`\n📦 Seeding ${allStates.length} states...`);

  const countries = await prisma.country.findMany({
    select: { id: true, isoCode: true },
  });
  const countryMap: Record<string, number> = Object.fromEntries(
    countries.map((c) => [c.isoCode, c.id]),
  );

  const data = allStates
    .filter((s: any) => countryMap[s.country_code])
    .map((s: any) => ({
      name: s.name,
      isoCode: s.iso2, //  correct field
      countryId: countryMap[s.country_code],
    }));

  for (let i = 0; i < data.length; i += 500) {
    await prisma.state.createMany({
      data: data.slice(i, i + 500),
      skipDuplicates: true,
    });
  }

  console.log(` ${data.length} states seeded`);
}

// ============================================================
//  STEP 4 — Seed Cities
//  JSON fields: state_id (links to state.id in JSON, not DB)
//  Strategy: map JSON state id → DB state id
// ============================================================
async function seedCities(): Promise<void> {
  console.log(`\n📦 Seeding cities for: ${SEED_CITIES_FOR_ISO.join(", ")}...`);

  // Get India's DB id
  const countries = await prisma.country.findMany({
    select: { id: true, isoCode: true },
    where: { isoCode: { in: SEED_CITIES_FOR_ISO } },
  });
  const countryIsoToDbId: Record<string, number> = Object.fromEntries(
    countries.map((c) => [c.isoCode, c.id]),
  );

  // Get all India states from DB
  const dbStates = await prisma.state.findMany({
    select: { id: true, isoCode: true },
    where: { country: { isoCode: { in: SEED_CITIES_FOR_ISO } } },
  });

  // Map DB state isoCode → DB state id
  const dbStateIsoToId: Record<string, number> = Object.fromEntries(
    dbStates.map((s) => [s.isoCode, s.id]),
  );

  // Filter India states from JSON → map JSON state id → DB state id
  const jsonIndiaStates = allStates.filter((s: any) =>
    SEED_CITIES_FOR_ISO.includes(s.country_code),
  );

  // key: JSON state id → DB state id (via iso2 matching)
  const jsonStateIdToDbId: Record<number, number> = {};
  for (const s of jsonIndiaStates) {
    const dbStateId = dbStateIsoToId[s.iso2];
    if (dbStateId) {
      jsonStateIdToDbId[s.id] = dbStateId;
    }
  }

  // Filter cities for India
  const filtered = allCities.filter((c: any) =>
    SEED_CITIES_FOR_ISO.includes(c.country_code),
  );
  console.log(`  Found ${filtered.length} cities to seed...`);

  const data = filtered
    .map((c: any) => {
      const dbStateId = jsonStateIdToDbId[c.state_id]; //  use state_id
      if (!dbStateId) return null;
      return { name: c.name, stateId: dbStateId };
    })
    .filter(Boolean);

  let inserted = 0;
  for (let i = 0; i < data.length; i += 1000) {
    await prisma.city.createMany({
      data: data.slice(i, i + 1000),
      skipDuplicates: true,
    });
    inserted += Math.min(1000, data.length - i);
    process.stdout.write(`\r  Progress: ${inserted}/${data.length} cities...`);
  }

  console.log(`\n ${data.length} cities seeded`);
}

// ============================================================
//  STEP 5 — Seed Postal Codes (major Indian cities)
// ============================================================
interface PostalEntry {
  city: string;
  state: string; // DB state isoCode e.g. "GJ"
  codes: string[];
}

const POSTAL_DATA: PostalEntry[] = [
  {
    city: "Ahmedabad",
    state: "GJ",
    codes: [
      "380001",
      "380002",
      "380003",
      "380004",
      "380005",
      "380006",
      "380007",
      "380008",
      "380009",
      "380013",
      "380014",
      "380015",
      "380016",
      "380019",
      "380021",
      "380022",
      "380023",
      "380024",
      "380025",
      "380026",
      "380027",
      "380051",
      "380052",
      "380054",
      "380055",
      "380058",
      "380059",
      "380060",
      "380061",
      "380063",
    ],
  },
  {
    city: "Surat",
    state: "GJ",
    codes: [
      "395001",
      "395002",
      "395003",
      "395004",
      "395005",
      "395006",
      "395007",
      "395008",
      "395009",
      "395010",
      "395017",
      "395023",
    ],
  },
  {
    city: "Vadodara",
    state: "GJ",
    codes: [
      "390001",
      "390002",
      "390003",
      "390004",
      "390005",
      "390006",
      "390007",
      "390008",
      "390009",
      "390010",
      "390011",
      "390012",
      "390013",
      "390015",
      "390016",
      "390017",
      "390018",
      "390019",
      "390020",
      "390021",
      "390022",
      "390023",
      "390024",
      "390025",
    ],
  },
  {
    city: "Rajkot",
    state: "GJ",
    codes: [
      "360001",
      "360002",
      "360003",
      "360004",
      "360005",
      "360006",
      "360007",
    ],
  },
  {
    city: "Mumbai",
    state: "MH",
    codes: [
      "400001",
      "400002",
      "400003",
      "400004",
      "400005",
      "400006",
      "400007",
      "400008",
      "400009",
      "400010",
      "400011",
      "400012",
      "400013",
      "400014",
      "400015",
      "400016",
      "400017",
      "400018",
      "400019",
      "400020",
      "400021",
      "400022",
      "400025",
      "400026",
      "400028",
      "400029",
      "400030",
      "400031",
      "400032",
      "400033",
      "400034",
      "400035",
      "400036",
      "400037",
      "400038",
      "400039",
      "400040",
      "400042",
      "400043",
      "400049",
      "400050",
      "400051",
      "400052",
      "400053",
      "400054",
      "400055",
      "400056",
      "400057",
      "400058",
      "400059",
      "400060",
      "400061",
      "400062",
      "400063",
      "400064",
      "400065",
      "400066",
      "400067",
      "400068",
      "400069",
      "400070",
      "400071",
      "400072",
      "400074",
      "400075",
      "400076",
      "400077",
      "400078",
      "400079",
      "400080",
      "400081",
      "400082",
      "400083",
      "400084",
      "400085",
      "400086",
      "400087",
      "400088",
      "400089",
      "400090",
      "400091",
      "400092",
      "400093",
      "400094",
      "400095",
      "400096",
      "400097",
      "400098",
      "400099",
      "400101",
      "400102",
      "400103",
      "400104",
    ],
  },
  {
    city: "Pune",
    state: "MH",
    codes: [
      "411001",
      "411002",
      "411003",
      "411004",
      "411005",
      "411006",
      "411007",
      "411008",
      "411009",
      "411011",
      "411012",
      "411013",
      "411014",
      "411015",
      "411016",
      "411017",
      "411018",
      "411019",
      "411020",
      "411021",
      "411022",
      "411023",
      "411024",
      "411025",
      "411026",
      "411027",
      "411028",
      "411029",
      "411030",
      "411031",
      "411032",
      "411033",
      "411034",
      "411035",
      "411036",
      "411037",
      "411038",
      "411039",
      "411040",
      "411041",
      "411042",
      "411043",
      "411044",
      "411045",
      "411046",
      "411047",
      "411048",
      "411051",
      "411052",
      "411057",
      "411058",
      "411060",
      "411061",
      "411062",
    ],
  },
  {
    city: "Delhi",
    state: "DL",
    codes: [
      "110001",
      "110002",
      "110003",
      "110004",
      "110005",
      "110006",
      "110007",
      "110008",
      "110009",
      "110010",
      "110011",
      "110012",
      "110013",
      "110014",
      "110015",
      "110016",
      "110017",
      "110018",
      "110019",
      "110020",
      "110021",
      "110022",
      "110023",
      "110024",
      "110025",
      "110026",
      "110027",
      "110028",
      "110029",
      "110030",
      "110031",
      "110032",
      "110033",
      "110034",
      "110035",
      "110036",
      "110037",
      "110038",
      "110039",
      "110040",
      "110041",
      "110042",
      "110043",
      "110044",
      "110045",
      "110046",
      "110047",
      "110048",
      "110049",
      "110051",
      "110052",
      "110053",
      "110054",
      "110055",
      "110056",
      "110057",
      "110058",
      "110059",
      "110060",
      "110061",
      "110062",
      "110063",
      "110064",
      "110065",
      "110066",
      "110067",
      "110068",
      "110069",
      "110070",
      "110071",
      "110072",
      "110073",
      "110074",
      "110075",
      "110076",
      "110077",
      "110078",
      "110081",
      "110082",
      "110083",
      "110084",
      "110085",
      "110086",
      "110087",
      "110088",
      "110089",
      "110090",
      "110091",
      "110092",
      "110093",
      "110094",
      "110095",
      "110096",
    ],
  },
  {
    city: "Bengaluru",
    state: "KA",
    codes: [
      "560001",
      "560002",
      "560003",
      "560004",
      "560005",
      "560006",
      "560007",
      "560008",
      "560009",
      "560010",
      "560011",
      "560012",
      "560013",
      "560014",
      "560015",
      "560016",
      "560017",
      "560018",
      "560019",
      "560020",
      "560021",
      "560022",
      "560023",
      "560024",
      "560025",
      "560026",
      "560027",
      "560028",
      "560029",
      "560030",
      "560032",
      "560033",
      "560034",
      "560035",
      "560036",
      "560037",
      "560038",
      "560040",
      "560041",
      "560042",
      "560043",
      "560045",
      "560046",
      "560047",
      "560048",
      "560049",
      "560050",
      "560051",
      "560052",
      "560053",
      "560054",
      "560055",
      "560056",
      "560057",
      "560058",
      "560059",
      "560060",
      "560061",
      "560062",
      "560063",
      "560064",
      "560065",
      "560066",
      "560068",
      "560069",
      "560070",
      "560071",
      "560072",
      "560073",
      "560074",
      "560075",
      "560076",
      "560077",
      "560078",
      "560079",
      "560080",
      "560082",
      "560083",
      "560085",
      "560086",
      "560092",
      "560094",
      "560095",
      "560096",
      "560097",
      "560098",
      "560099",
      "560100",
      "560102",
      "560103",
      "560104",
      "560105",
    ],
  },
  {
    city: "Chennai",
    state: "TN",
    codes: [
      "600001",
      "600002",
      "600003",
      "600004",
      "600005",
      "600006",
      "600007",
      "600008",
      "600009",
      "600010",
      "600011",
      "600012",
      "600013",
      "600014",
      "600015",
      "600016",
      "600017",
      "600018",
      "600019",
      "600020",
      "600021",
      "600022",
      "600023",
      "600024",
      "600025",
      "600026",
      "600028",
      "600029",
      "600030",
      "600031",
      "600032",
      "600033",
      "600034",
      "600035",
      "600036",
      "600037",
      "600038",
      "600039",
      "600040",
      "600041",
      "600042",
      "600043",
      "600044",
      "600045",
      "600046",
      "600047",
      "600048",
      "600049",
      "600050",
      "600051",
      "600052",
      "600053",
      "600054",
      "600055",
      "600056",
      "600057",
      "600058",
      "600059",
      "600060",
      "600061",
      "600062",
      "600063",
      "600064",
      "600065",
      "600066",
      "600069",
      "600070",
      "600071",
      "600072",
      "600073",
      "600074",
      "600075",
      "600076",
      "600077",
      "600078",
      "600079",
      "600080",
      "600082",
      "600083",
      "600084",
      "600085",
      "600086",
      "600087",
      "600088",
      "600089",
      "600090",
      "600091",
      "600092",
      "600093",
      "600094",
      "600095",
      "600096",
      "600097",
      "600098",
      "600099",
      "600100",
    ],
  },
  {
    city: "Hyderabad",
    state: "TS",
    codes: [
      "500001",
      "500002",
      "500003",
      "500004",
      "500005",
      "500006",
      "500007",
      "500008",
      "500009",
      "500010",
      "500011",
      "500012",
      "500013",
      "500014",
      "500015",
      "500016",
      "500017",
      "500018",
      "500019",
      "500020",
      "500021",
      "500022",
      "500023",
      "500024",
      "500025",
      "500026",
      "500027",
      "500028",
      "500029",
      "500030",
      "500031",
      "500032",
      "500033",
      "500034",
      "500035",
      "500036",
      "500037",
      "500038",
      "500039",
      "500040",
      "500041",
      "500042",
      "500043",
      "500044",
      "500045",
      "500046",
      "500047",
      "500048",
      "500049",
      "500050",
      "500051",
      "500052",
      "500053",
      "500054",
      "500055",
      "500056",
      "500057",
      "500058",
      "500059",
      "500060",
      "500061",
      "500062",
      "500063",
      "500064",
      "500065",
      "500066",
      "500067",
      "500068",
      "500069",
      "500070",
      "500071",
      "500072",
      "500073",
      "500074",
      "500075",
      "500076",
      "500077",
      "500078",
      "500079",
      "500080",
      "500081",
      "500082",
      "500083",
      "500084",
      "500085",
      "500086",
      "500087",
      "500088",
      "500089",
      "500090",
      "500091",
      "500092",
      "500093",
      "500094",
      "500095",
      "500096",
      "500097",
      "500098",
    ],
  },
  {
    city: "Kolkata",
    state: "WB",
    codes: [
      "700001",
      "700002",
      "700003",
      "700004",
      "700005",
      "700006",
      "700007",
      "700008",
      "700009",
      "700010",
      "700011",
      "700012",
      "700013",
      "700014",
      "700015",
      "700016",
      "700017",
      "700018",
      "700019",
      "700020",
      "700021",
      "700022",
      "700023",
      "700024",
      "700025",
      "700026",
      "700027",
      "700028",
      "700029",
      "700030",
      "700031",
      "700032",
      "700033",
      "700034",
      "700035",
      "700036",
      "700037",
      "700038",
      "700039",
      "700040",
      "700041",
      "700042",
      "700043",
      "700044",
      "700045",
      "700046",
      "700047",
      "700048",
      "700049",
      "700050",
      "700051",
      "700052",
      "700053",
      "700054",
      "700055",
      "700056",
      "700057",
      "700058",
      "700059",
      "700060",
      "700061",
      "700062",
      "700063",
      "700064",
      "700065",
      "700066",
      "700067",
      "700068",
      "700069",
      "700070",
      "700071",
      "700072",
      "700073",
      "700074",
      "700075",
      "700076",
      "700077",
      "700078",
      "700079",
      "700080",
      "700081",
      "700082",
      "700083",
      "700084",
      "700085",
      "700086",
      "700087",
      "700088",
      "700089",
      "700090",
      "700091",
      "700092",
      "700093",
      "700094",
      "700095",
      "700096",
      "700097",
      "700098",
      "700099",
      "700100",
    ],
  },
  {
    city: "Jaipur",
    state: "RJ",
    codes: [
      "302001",
      "302002",
      "302003",
      "302004",
      "302005",
      "302006",
      "302007",
      "302008",
      "302009",
      "302010",
      "302011",
      "302012",
      "302013",
      "302014",
      "302015",
      "302016",
      "302017",
      "302018",
      "302019",
      "302020",
      "302021",
      "302022",
      "302023",
      "302024",
      "302025",
      "302026",
      "302027",
      "302028",
      "302029",
      "302030",
      "302031",
      "302032",
      "302033",
      "302034",
      "302036",
      "302037",
      "302038",
      "302039",
      "302040",
      "302041",
      "302042",
      "302043",
      "302044",
      "302045",
      "302046",
      "302047",
      "302048",
      "302049",
      "302050",
    ],
  },
];

async function seedPostalCodes(): Promise<void> {
  console.log("\n📦 Seeding postal codes for major cities...");

  const india = await prisma.country.findUnique({ where: { isoCode: "IN" } });
  if (!india) {
    console.log("  ⚠ India not found, skipping");
    return;
  }

  let totalInserted = 0;

  for (const entry of POSTAL_DATA) {
    const state = await prisma.state.findFirst({
      where: { isoCode: entry.state, countryId: india.id },
    });
    if (!state) {
      console.log(`  ⚠ State ${entry.state} not found`);
      continue;
    }

    let city = await prisma.city.findFirst({
      where: {
        name: { equals: entry.city, mode: "insensitive" },
        stateId: state.id,
      },
    });
    if (!city) {
      city = await prisma.city.create({
        data: { name: entry.city, stateId: state.id },
      });
    }

    totalInserted += entry.codes.length;
    console.log(`   ${entry.codes.length} codes → ${entry.city}`);
  }

  console.log(`   ${totalInserted} postal codes seeded total`);
}

// ============================================================
//  STEP 6 — Seed Users
// ============================================================
async function seedUsers(): Promise<void> {
  console.log("\n📦 Seeding users...");

  const india = await prisma.country.findUnique({ where: { isoCode: "IN" } });
  if (!india) throw new Error("India not found in DB");

  const gujarat = await prisma.state.findFirst({
    where: { isoCode: "GJ", countryId: india.id },
  });
  if (!gujarat) throw new Error("Gujarat not found in DB");

  const ahmedabad = await prisma.city.findFirst({
    where: {
      name: { contains: "Ahmedabad", mode: "insensitive" },
      stateId: gujarat.id,
    },
  });
  const surat = await prisma.city.findFirst({
    where: {
      name: { contains: "Surat", mode: "insensitive" },
      stateId: gujarat.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@gmail.com",
      password: await bcrypt.hash("Admin@123", 10),
      role: "ADMIN",
      phone: "9999999999",
      address: "123 Admin Street",
      countryId: india.id,
      stateId: gujarat.id,
      cityId: ahmedabad?.id ?? null,
    },
  });

  await prisma.user.create({
    data: {
      name: "Raj Patel",
      email: "raj@gmail.com",
      password: await bcrypt.hash("User@123", 10),
      role: "USER",
      phone: "9876543210",
      address: "45 Nehru Road",
      countryId: india.id,
      stateId: gujarat.id,
      cityId: ahmedabad?.id ?? null,
    },
  });

  await prisma.user.create({
    data: {
      name: "Priya Shah",
      email: "priya@gmail.com",
      password: await bcrypt.hash("User@123", 10),
      role: "USER",
      phone: "9123456789",
      address: "78 MG Road",
      countryId: india.id,
      stateId: gujarat.id,
      cityId: surat?.id ?? null,
    },
  });

  console.log(" 3 Users created");
}

// ============================================================
//  STEP 7 — Seed Categories & Products
// ============================================================
async function seedCategoriesAndProducts(): Promise<void> {
  console.log("\n📦 Seeding categories & products...");

  const electronics = await prisma.category.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets, devices and electronic accessories",
      image: "/uploads/categories/1773298131148-369088.jpeg",
    },
  });
  const bags = await prisma.category.create({
    data: {
      name: "Bags",
      slug: "bags",
      description: "Handbags, purses and luggage",
      image: "/uploads/categories/1773660233823-404353.jpeg",
    },
  });
  const beauty = await prisma.category.create({
    data: {
      name: "Beauty",
      slug: "beauty",
      description: "Perfumes, skincare and cosmetics",
      image: "/uploads/categories/1773660092149-594261.jpeg",
    },
  });
  console.log(" 3 Categories created");

  const mobiles = await prisma.subCategory.create({
    data: {
      name: "Mobiles",
      description: "Smartphones",
      categoryId: electronics.id,
    },
  });
  const cameras = await prisma.subCategory.create({
    data: {
      name: "Cameras",
      description: "Digital and mirrorless cameras",
      categoryId: electronics.id,
    },
  });
  const tvs = await prisma.subCategory.create({
    data: {
      name: "TVs",
      description: "Smart televisions",
      categoryId: electronics.id,
    },
  });
  const audio = await prisma.subCategory.create({
    data: {
      name: "Audio",
      description: "Earphones and headphones",
      categoryId: electronics.id,
    },
  });
  const womensBags = await prisma.subCategory.create({
    data: {
      name: "Women's Bags",
      description: "Handbags and purses",
      categoryId: bags.id,
    },
  });
  const perfumes = await prisma.subCategory.create({
    data: {
      name: "Perfumes",
      description: "Men and women fragrances",
      categoryId: beauty.id,
    },
  });
  const skincare = await prisma.subCategory.create({
    data: {
      name: "Skincare",
      description: "Face oils, lotions and more",
      categoryId: beauty.id,
    },
  });
  console.log(" 7 SubCategories created");

  await prisma.product.createMany({
    data: [
      {
        name: "iPhone 15 Pro Max",
        description: "Latest iPhone with A17 Pro chip",
        price: 134900,
        discount: 5,
        stock: 18,
        image: "/uploads/products/iphone-15-pro.png",
        images: [],
        status: "ACTIVE",
        isFeatured: true,
        subCategoryId: mobiles.id,
      },
      {
        name: "Samsung Galaxy S25 Ultra",
        description: "Flagship Samsung smartphone",
        price: 124999,
        discount: 8,
        stock: 22,
        image: "/uploads/products/samsung-s25-ultra.png",
        images: [],
        status: "ACTIVE",
        isFeatured: true,
        subCategoryId: mobiles.id,
      },
      {
        name: "iPhone 13 Pro",
        description: "Previous generation iPhone",
        price: 89900,
        discount: 10,
        stock: 20,
        image: "/uploads/products/iphone-13-pro.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: mobiles.id,
      },
      {
        name: "Samsung Galaxy S24",
        description: "Latest Samsung flagship",
        price: 79999,
        discount: 8,
        stock: 25,
        image: "/uploads/products/samsung-s24.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: mobiles.id,
      },
      {
        name: "Sony Professional Camera",
        description: "High-end mirrorless camera",
        price: 89999,
        discount: 5,
        stock: 15,
        image: "/uploads/products/sony-camera.png",
        images: [],
        status: "ACTIVE",
        isFeatured: true,
        subCategoryId: cameras.id,
      },
      {
        name: 'Samsung 55" Smart TV',
        description: "4K UHD Smart Television",
        price: 54999,
        discount: 10,
        stock: 20,
        image: "/uploads/products/samsung-tv.png",
        images: [],
        status: "ACTIVE",
        isFeatured: true,
        subCategoryId: tvs.id,
      },
      {
        name: "Apple AirPods Pro",
        description: "Wireless earbuds with ANC",
        price: 24900,
        discount: 5,
        stock: 25,
        image: "/uploads/products/airpods-pro.png",
        images: [],
        status: "ACTIVE",
        isFeatured: true,
        subCategoryId: audio.id,
      },
      {
        name: "Prada Milano Purse",
        description: "Designer luxury handbag",
        price: 85000,
        discount: 0,
        stock: 18,
        image: "/uploads/products/prada-purse.png",
        images: [],
        status: "ACTIVE",
        isFeatured: true,
        subCategoryId: womensBags.id,
      },
      {
        name: "Gucci Black Purse",
        description: "Premium Gucci handbag",
        price: 92000,
        discount: 0,
        stock: 12,
        image: "/uploads/products/gucci-purse.png",
        images: [],
        status: "ACTIVE",
        isFeatured: true,
        subCategoryId: womensBags.id,
      },
      {
        name: "Designer Women Bag",
        description: "Stylish designer handbag",
        price: 45000,
        discount: 10,
        stock: 20,
        image: "/uploads/products/designer-bag.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: womensBags.id,
      },
      {
        name: "Women Handbag Orange",
        description: "Vibrant orange handbag",
        price: 12999,
        discount: 15,
        stock: 25,
        image: "/uploads/products/handbag-orange.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: womensBags.id,
      },
      {
        name: "YSL Women Purse",
        description: "Yves Saint Laurent luxury purse",
        price: 78000,
        discount: 0,
        stock: 15,
        image: "/uploads/products/ysl-purse.png",
        images: [],
        status: "ACTIVE",
        isFeatured: true,
        subCategoryId: womensBags.id,
      },
      {
        name: "Versace Eros Perfume",
        description: "Premium men's fragrance",
        price: 8999,
        discount: 10,
        stock: 30,
        image: "/uploads/products/versace-eros.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: perfumes.id,
      },
      {
        name: "Bleu De Chanel Perfume",
        description: "Iconic Chanel fragrance",
        price: 12500,
        discount: 5,
        stock: 22,
        image: "/uploads/products/bleu-de-chanel.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: perfumes.id,
      },
      {
        name: "Coco Noir Chanel",
        description: "Elegant women's perfume",
        price: 14999,
        discount: 5,
        stock: 18,
        image: "/uploads/products/coco-noir.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: perfumes.id,
      },
      {
        name: "Alya Skin Face Oil",
        description: "Nourishing face oil",
        price: 2499,
        discount: 10,
        stock: 15,
        image: "/uploads/products/alya-skin.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: skincare.id,
      },
      {
        name: "Necessaire Body Lotion",
        description: "Luxury body moisturizer",
        price: 3999,
        discount: 10,
        stock: 12,
        image: "/uploads/products/necessaire.png",
        images: [],
        status: "ACTIVE",
        isFeatured: false,
        subCategoryId: skincare.id,
      },
    ],
  });

  console.log(" 17 Products created");
}
// ============================================================
//  STEP 8 — Seed Hero Slides
// ============================================================
async function seedHeroSlides(): Promise<void> {
  console.log("\n📦 Seeding hero slides...");

  await prisma.heroSlide.createMany({
    data: [
      {
        image: "/uploads/hero/Iphone 15 Pro.jpg",
        eyebrow: "New Arrival",
        title: "The Future of Mobile is Here",
        titleSpan: "Mobile",
        subtitle: "iPhone 15 Pro — Titanium. So strong. So light. So Pro.",
        order: 0,
        isActive: true,
      },
      {
        image: "/uploads/hero/Samsung Galaxy s25 ultra.jpg",
        eyebrow: "Best Seller",
        title: "Galaxy S25 Ultra — Redefine Power",
        titleSpan: "Redefine",
        subtitle: "The most powerful Galaxy ever made. Built for creators.",
        order: 1,
        isActive: true,
      },
      {
        image: "/uploads/hero/macbook(2023).jpg",
        eyebrow: "Top Pick",
        title: "Work Smarter with MacBook",
        titleSpan: "MacBook",
        subtitle: "M3 chip. All-day battery. Stunning Retina display.",
        order: 2,
        isActive: true,
      },
      {
        image: "/uploads/hero/Sony Camera.jpg",
        eyebrow: "For Creators",
        title: "Capture Every Moment Perfectly",
        titleSpan: "Moment",
        subtitle: "Sony's finest — professional photography made easy.",
        order: 3,
        isActive: true,
      },
      {
        image: "/uploads/hero/Samsung smart tv.jpg",
        eyebrow: "Home Theater",
        title: "Cinema-Grade Viewing At Home",
        titleSpan: "Viewing",
        subtitle: "Samsung Smart TV — immersive 4K experience.",
        order: 4,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log(" 5 Hero slides seeded");
}
// ============================================================
//  MAIN
// ============================================================
async function main(): Promise<void> {
  console.log(" Starting Shop.in full seed...\n");

  await clearData();
  await seedCountries();
  await seedStates();
  await seedCities();
  await seedPostalCodes();
  await seedUsers();
  await seedCategoriesAndProducts();
  await seedHeroSlides();

  console.log("\n Seed complete!");
  console.log("─────────────────────────────────────────────");
  console.log(" Admin  → admin@gmail.com  | Admin@123");
  console.log(" User 1 → raj@gmail.com    | User@123");
  console.log(" User 2 → priya@gmail.com  | User@123");
  console.log("─────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(" Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
