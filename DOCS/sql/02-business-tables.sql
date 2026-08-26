-- ============================================================
-- H-Sport: Tabel BISNIS (fabrics, batches, orders, BOM, timeline, costing)
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Catatan: tabel "profiles" TIDAK termasuk — sudah dibuat via 01-profiles.sql
-- ============================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "fabrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "reorder_point" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_batches" (
    "id" TEXT NOT NULL,
    "fabric_id" UUID NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "purchase_date" DATE NOT NULL,
    "qty_purchased" DOUBLE PRECISION NOT NULL,
    "qty_remaining" DOUBLE PRECISION NOT NULL,
    "price_per_kg" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fabric_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_contact" TEXT,
    "qty_items" INTEGER NOT NULL,
    "specification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "order_date" DATE NOT NULL,
    "deadline" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "fabric_id" UUID NOT NULL,
    "fabric_name" TEXT NOT NULL,
    "qty_required" DOUBLE PRECISION NOT NULL,
    "waste_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qty_actual" DOUBLE PRECISION NOT NULL,
    "price_per_kg" DOUBLE PRECISION NOT NULL,
    "material_cost" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_timelines" (
    "id" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "stage_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "estimated_hrs" DOUBLE PRECISION,
    "actual_start" TIMESTAMPTZ(6),
    "actual_end" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_costing" (
    "id" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "material_cost" DOUBLE PRECISION NOT NULL,
    "labor_cost" DOUBLE PRECISION NOT NULL,
    "hpp" DOUBLE PRECISION NOT NULL,
    "pricing_method" TEXT NOT NULL DEFAULT 'markup',
    "markup_pct" DOUBLE PRECISION,
    "fixed_profit" DOUBLE PRECISION DEFAULT 0,
    "selling_price" DOUBLE PRECISION NOT NULL,
    "shipping_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profit" DOUBLE PRECISION NOT NULL,
    "profit_margin" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_costing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_usage" (
    "id" TEXT NOT NULL,
    "batch_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "qty_used" DOUBLE PRECISION NOT NULL,
    "usage_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fabric_batches_fabric_id_idx" ON "fabric_batches"("fabric_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "bom_items_order_id_idx" ON "bom_items"("order_id");

-- CreateIndex
CREATE INDEX "bom_items_fabric_id_idx" ON "bom_items"("fabric_id");

-- CreateIndex
CREATE INDEX "production_timelines_order_id_idx" ON "production_timelines"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_costing_order_id_key" ON "order_costing"("order_id");

-- CreateIndex
CREATE INDEX "batch_usage_batch_id_idx" ON "batch_usage"("batch_id");

-- CreateIndex
CREATE INDEX "batch_usage_order_id_idx" ON "batch_usage"("order_id");

-- AddForeignKey
ALTER TABLE "fabric_batches" ADD CONSTRAINT "fabric_batches_fabric_id_fkey" FOREIGN KEY ("fabric_id") REFERENCES "fabrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_fabric_id_fkey" FOREIGN KEY ("fabric_id") REFERENCES "fabrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_timelines" ADD CONSTRAINT "production_timelines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_costing" ADD CONSTRAINT "order_costing_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_usage" ADD CONSTRAINT "batch_usage_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "fabric_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

