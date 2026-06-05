-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "public"."MealLog" ADD CONSTRAINT "MealLog_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "public"."MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
