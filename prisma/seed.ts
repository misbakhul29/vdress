import { Prisma } from "@prisma/client";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("🌱 Mulai seeding database...");

  // 1. Seed Gacha Items
  const gachaItems = [
    {
      id: 1,
      rarity: "SSR",
      item_name: "MikoA",
      part_outfit: "bottom",
      rate_up: true,
      islimited: true,
      layer: "a",
      stat: { speed: 70, attack: 85, defense: 95 },
      power: 250,
    },
    {
      id: 2,
      rarity: "SSR",
      item_name: "MikoB",
      part_outfit: "top",
      rate_up: true,
      islimited: true,
      layer: "b",
      stat: { magic: 80, speed: 75, attack: 90 },
      power: 260,
    },
    {
      id: 3,
      rarity: "SSR",
      item_name: "MikoC",
      part_outfit: "feet",
      rate_up: true,
      islimited: true,
      layer: "c",
      stat: { speed: 100, defense: 80 },
      power: 240,
    },
    {
      id: 4,
      rarity: "SSR",
      item_name: "MaidA",
      part_outfit: "bottom",
      rate_up: false,
      islimited: false,
      layer: "a",
      stat: { speed: 60, attack: 75, defense: 85 },
      power: 220,
    },
    {
      id: 5,
      rarity: "SSR",
      item_name: "MaidB",
      part_outfit: "top",
      rate_up: false,
      islimited: false,
      layer: "b",
      stat: { magic: 70, speed: 65, attack: 80 },
      power: 230,
    },
    {
      id: 6,
      rarity: "SSR",
      item_name: "MaidC",
      part_outfit: "feet",
      rate_up: false,
      islimited: false,
      layer: "c",
      stat: { speed: 90, defense: 70 },
      power: 210,
    },
    {
      id: 7,
      rarity: "SR",
      item_name: "SeifukuA",
      part_outfit: "bottom",
      rate_up: true,
      islimited: false,
      layer: "a",
      stat: { speed: 50, attack: 60, defense: 70 },
      power: 180,
    },
    {
      id: 8,
      rarity: "SR",
      item_name: "SeifukuB",
      part_outfit: "top",
      rate_up: true,
      islimited: false,
      layer: "b",
      stat: { magic: 55, speed: 55, attack: 65 },
      power: 175,
    },
    {
      id: 9,
      rarity: "SR",
      item_name: "SeifukuC",
      part_outfit: "feet",
      rate_up: true,
      islimited: false,
      layer: "c",
      stat: { speed: 75, defense: 50 },
      power: 155,
    },
    {
      id: 10,
      rarity: "SR",
      item_name: "PoliceA",
      part_outfit: "bottom",
      rate_up: false,
      islimited: false,
      layer: "a",
      stat: { speed: 40, attack: 50, defense: 60 },
      power: 150,
    },
    {
      id: 11,
      rarity: "SR",
      item_name: "PoliceB",
      part_outfit: "top",
      rate_up: false,
      islimited: false,
      layer: "b",
      stat: { magic: 45, speed: 45, attack: 55 },
      power: 145,
    },
    {
      id: 12,
      rarity: "SR",
      item_name: "PoliceC",
      part_outfit: "feet",
      rate_up: false,
      islimited: false,
      layer: "c",
      stat: { speed: 65, defense: 40 },
      power: 125,
    },
    {
      id: 13,
      rarity: "R",
      item_name: "ShirtA",
      part_outfit: "bottom",
      rate_up: false,
      islimited: false,
      layer: "a",
      stat: Prisma.JsonNull,
      power: null,
    },
    {
      id: 14,
      rarity: "R",
      item_name: "ShirtB",
      part_outfit: "top",
      rate_up: false,
      islimited: false,
      layer: "b",
      stat: Prisma.JsonNull,
      power: null,
    },
    {
      id: 15,
      rarity: "R",
      item_name: "ShirtC",
      part_outfit: "feet",
      rate_up: false,
      islimited: false,
      layer: "c",
      stat: Prisma.JsonNull,
      power: null,
    },
  ];

  for (const item of gachaItems) {
    await prisma.gachaItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ ${gachaItems.length} Gacha Items berhasil di-seed`);

  // 2. Seed Token Items
  const tokenItems = [
    {
      id: 1,
      name: "shimmering_essence",
      description: "Essence for wishing on standard banner.",
      price: 5,
    },
    {
      id: 2,
      name: "glimmering_essence",
      description: "Essence for wishing on limited banner.",
      price: 5,
    },
    {
      id: 3,
      name: "SeifukuC",
      description: "Feet outfit item from gacha.",
      price: 34,
    },
    {
      id: 4,
      name: "SeifukuB",
      description: "Top outfit item from gacha.",
      price: 34,
    },
    {
      id: 5,
      name: "SeifukuA",
      description: "Bottom outfit item from gacha.",
      price: 34,
    },
  ];

  for (const item of tokenItems) {
    await prisma.tokenItems.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ ${tokenItems.length} Token Items berhasil di-seed`);

  // 3. Seed Dust Items
  const dustItems = [
    {
      id: 1,
      name: "shimmering_essence",
      description: "Essence for wishing on standard banner.",
      price: 75,
    },
    {
      id: 2,
      name: "glimmering_essence",
      description: "Essence for wishing on limited banner.",
      price: 75,
    },
  ];

  for (const item of dustItems) {
    await prisma.dustItems.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ ${dustItems.length} Dust Items berhasil di-seed`);

  // 4. Seed Products
  const products = [
    { id: 1, name: "Starter Gems Pack", price: 15000, glamour_gems: 60 },
    { id: 2, name: "Small Gems Pack", price: 75000, glamour_gems: 300 },
    { id: 3, name: "Medium Gems Pack", price: 150000, glamour_gems: 980 },
    { id: 4, name: "Large Gems Pack", price: 300000, glamour_gems: 1980 },
    { id: 5, name: "Ultimate Gems Pack", price: 750000, glamour_gems: 3280 },
  ];

  for (const product of products) {
    await prisma.products.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }
  console.log(`✅ ${products.length} Products berhasil di-seed`);

  console.log("🎉 Seeding database selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
