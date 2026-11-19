-- ==========================================
-- NORMALIZACION DE DISPONIBILIDAD
-- ==========================================

-- Iniciar transaccion
BEGIN;

-- ==========================================
-- 1. VERIFICAR LOS DATOS
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "trabajadores" t
    WHERE
      EXISTS (
        SELECT unnest(t."disponibilidadDias")
        EXCEPT
        SELECT d."dia"
        FROM "disponibilidad_trabajador" d
        WHERE d."trabajadorId" = t."id"
      )
      OR EXISTS (
        SELECT d."dia"
        FROM "disponibilidad_trabajador" d
        WHERE d."trabajadorId" = t."id"
        EXCEPT
        SELECT unnest(t."disponibilidadDias")
      )
  ) THEN
    RAISE EXCEPTION
      'Error: Los datos de disponibilidad no coinciden. Se cancela la migracion.';
  END IF;
END
$$;

-- ==========================================
-- 2. ELIMINAR LA COLUMNA ANTIGUA
-- ==========================================

ALTER TABLE "trabajadores"
DROP COLUMN "disponibilidadDias";

-- ==========================================
-- 3. CONFIRMAR CAMBIOS
-- ==========================================

COMMIT;