-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "mealItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_userId_mealItemId_key" ON "MealLog"("userId", "mealItemId");

-- CreateIndex
CREATE INDEX "MealLog_userId_mealPlanId_idx" ON "MealLog"("userId", "mealPlanId");

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_mealItemId_fkey" FOREIGN KEY ("mealItemId") REFERENCES "MealItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
