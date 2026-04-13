-- CreateTable
CREATE TABLE "meat_items" (
    "id" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "meat_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_consumption" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "meat_item_id" TEXT NOT NULL,
    "quantity_kg" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_consumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_consumption_date_meat_item_id_key" ON "daily_consumption"("date", "meat_item_id");

-- AddForeignKey
ALTER TABLE "daily_consumption" ADD CONSTRAINT "daily_consumption_meat_item_id_fkey" FOREIGN KEY ("meat_item_id") REFERENCES "meat_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
