import { prisma } from "../src/lib/prisma.js";

/** [modelName, code, brandName] */
const MODELS = [
  ["Corolla", "COROLLA", "Toyota"],
  ["Corolla Axio", "AXIO", "Toyota"],
  ["Vitz", "VITZ", "Toyota"],
  ["Passo", "PASSO", "Toyota"],
  ["Belta", "BELTA", "Toyota"],
  ["Probox", "PROBOX", "Toyota"],
  ["Succeed", "SUCCEED", "Toyota"],
  ["Noah", "NOAH", "Toyota"],
  ["Voxy", "VOXY", "Toyota"],
  ["HiAce", "HIACE", "Toyota"],
  ["Hilux", "HILUX", "Toyota"],
  ["Land Cruiser Prado", "PRADO", "Toyota"],
  ["Land Cruiser V8", "LCV8", "Toyota"],
  ["RAV4", "RAV4", "Toyota"],
  ["Harrier", "HARRIER", "Toyota"],
  ["Sunny", "SUNNY", "Nissan"],
  ["Note", "NOTE", "Nissan"],
  ["X-Trail", "XTRAIL", "Nissan"],
  ["AD Van", "ADVAN", "Nissan"],
  ["Wingroad", "WINGROAD", "Nissan"],
  ["Patrol", "PATROL", "Nissan"],
  ["UD Truck", "NISUD", "Nissan"],
  ["Sprinter", "SPRINTER", "Mercedes-Benz"],
  ["Actros", "ACTROS", "Mercedes-Benz"],
  ["A-Class", "ACLASS", "Mercedes-Benz"],
  ["C-Class", "CCLASS", "Mercedes-Benz"],
  ["E-Class", "ECLASS", "Mercedes-Benz"],
  ["Fit", "FIT", "Honda"],
  ["Civic", "CIVIC", "Honda"],
  ["CR-V", "CRV", "Honda"],
  ["Accord", "ACCORD", "Honda"],
  ["Elantra", "ELANTRA", "Hyundai"],
  ["Accent", "ACCENT", "Hyundai"],
  ["Tucson", "TUCSON", "Hyundai"],
  ["Santa Fe", "SANTAFE", "Hyundai"],
  ["Picanto", "PICANTO", "Kia"],
  ["Rio", "RIO", "Kia"],
  ["Sportage", "SPORTAGE", "Kia"],
  ["Sorento", "SORENTO", "Kia"],
  ["Pajero", "PAJERO", "Mitsubishi"],
  ["Canter Truck", "CANTER", "Mitsubishi"],
  ["L200", "L200", "Mitsubishi"],
  ["Alto", "ALTO", "Suzuki"],
  ["Swift", "SWIFT", "Suzuki"],
  ["Ertiga", "ERTIGA", "Suzuki"],
  ["N-Series Truck", "NTRUCK", "Isuzu"],
  ["F-Series Truck", "FTRUCK", "Isuzu"],
  ["Trooper", "TROOPER", "Isuzu"],
  ["Ranger", "RANGER", "Ford"],
  ["Everest", "EVEREST", "Ford"],
  ["Transit Van", "TRANSIT", "Ford"],
  ["Cruze", "CRUZE", "Chevrolet"],
  ["Trailblazer", "TRAIL", "Chevrolet"],
  ["Silverado", "SILVERADO", "Chevrolet"],
  ["Demio", "DEMIO", "Mazda"],
  ["CX-5", "CX5", "Mazda"],
  ["Bongo Van", "BONGO", "Mazda"],
  ["Golf", "GOLF", "Volkswagen"],
  ["Passat", "PASSAT", "Volkswagen"],
  ["Tiguan", "TIGUAN", "Volkswagen"],
  ["3 Series", "BMW3", "BMW"],
  ["5 Series", "BMW5", "BMW"],
  ["X5", "X5", "BMW"],
  ["A4", "A4", "Audi"],
  ["A6", "A6", "Audi"],
  ["Q7", "Q7", "Audi"],
  ["Impreza", "IMPREZA", "Subaru"],
  ["Forester", "FORESTER", "Subaru"],
  ["Legacy", "LEGACY", "Subaru"],
  ["RX", "RX", "Lexus"],
  ["LX570", "LX570", "Lexus"],
  ["ES", "ES", "Lexus"],
  ["Wrangler", "WRANGLER", "Jeep"],
  ["Cherokee", "CHEROKEE", "Jeep"],
  ["Grand Cherokee", "GCHEROKEE", "Jeep"],
  ["Terios", "TERIOS", "Daihatsu"],
  ["Mira", "MIRA", "Daihatsu"],
  ["Hijet", "HIJET", "Daihatsu"],
  ["Defender", "DEFENDER", "Land Rover"],
  ["Range Rover", "RANGE", "Land Rover"],
  ["Discovery", "DISCOVERY", "Land Rover"],
  ["SURF", "SUR", "Toyota"],
];

async function main() {
  const brandNames = [...new Set(MODELS.map(([, , brand]) => brand))];
  const brandMap = new Map();

  for (const name of brandNames) {
    const brand = await prisma.vehicleBrand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    brandMap.set(name, brand.id);
  }

  let created = 0;
  let updated = 0;

  for (const [name, code, brandName] of MODELS) {
    const brandId = brandMap.get(brandName);
    const existing = await prisma.vehicleModel.findUnique({
      where: { brandId_name: { brandId, name } },
    });

    if (existing) {
      await prisma.vehicleModel.update({
        where: { id: existing.id },
        data: { description: code, createdBy: "seed" },
      });
      updated++;
    } else {
      await prisma.vehicleModel.create({
        data: {
          brandId,
          name,
          description: code,
          createdBy: "seed",
        },
      });
      created++;
    }
  }

  const brandCount = await prisma.vehicleBrand.count();
  const modelCount = await prisma.vehicleModel.count();
  console.log(`Brands in DB: ${brandCount}`);
  console.log(`Models in DB: ${modelCount}`);
  console.log(`Seed complete — ${created} created, ${updated} updated`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
