-- ============================================================
-- H-Sport: Tabel tambahan MONTHLY_SUMMARIES
-- (precompute untuk dashboard & laporan — anti OLAP berat)
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE "monthly_summaries" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "total_orders" INTEGER NOT NULL,
    "total_revenue" DOUBLE PRECISION NOT NULL,
    "total_hpp" DOUBLE PRECISION NOT NULL,
    "total_profit" DOUBLE PRECISION NOT NULL,
    "avg_margin" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "monthly_summaries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monthly_summaries_month_key" ON "monthly_summaries"("month");

-- ============================================================
-- Isi data dari order yang sudah ada (sekali jalan):
-- ============================================================
INSERT INTO monthly_summaries (id, month, total_orders, total_revenue, total_hpp, total_profit, avg_margin, updated_at)
SELECT
  'ms-' || to_char(o.order_date, 'YYYY-MM'),
  to_char(o.order_date, 'YYYY-MM') as month,
  COUNT(*)::int,
  COALESCE(SUM(oc.selling_price), 0),
  COALESCE(SUM(oc.hpp), 0),
  COALESCE(SUM(oc.profit), 0),
  CASE WHEN SUM(oc.selling_price) > 0 THEN (SUM(oc.profit) / SUM(oc.selling_price)) * 100 ELSE 0 END,
  now()
FROM orders o
LEFT JOIN order_costing oc ON oc.order_id = o.id
WHERE o.status != 'draft'
GROUP BY 1, 2
ON CONFLICT (month) DO UPDATE SET
  total_orders = EXCLUDED.total_orders,
  total_revenue = EXCLUDED.total_revenue,
  total_hpp = EXCLUDED.total_hpp,
  total_profit = EXCLUDED.total_profit,
  avg_margin = EXCLUDED.avg_margin,
  updated_at = now();
