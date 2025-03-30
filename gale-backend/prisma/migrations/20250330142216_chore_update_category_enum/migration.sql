/*
  Warnings:

  - The values [Cervejas,Tabacaria,NaoAlcoolicos,Destilados,Fermentados,Guloseimas,FriosCongelados,FarmaciaHigienePessoal,Mercearia,Vinhos,Salgadinhos,Outros] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.
  - The values [l] on the enum `SizeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('Beers', 'Tobacco', 'NonAlcoholic', 'Spirits', 'Candy', 'FrozenFoods', 'PharmacyPersonalCare', 'Grocery', 'Wines', 'Snacks', 'Others');
ALTER TABLE "Product" ALTER COLUMN "category" TYPE "Category_new" USING ("category"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "Category_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SizeType_new" AS ENUM ('g', 'L', 'ml', 'mg', 'kg', 'un');
ALTER TABLE "Product" ALTER COLUMN "sizeType" TYPE "SizeType_new" USING ("sizeType"::text::"SizeType_new");
ALTER TYPE "SizeType" RENAME TO "SizeType_old";
ALTER TYPE "SizeType_new" RENAME TO "SizeType";
DROP TYPE "SizeType_old";
COMMIT;
