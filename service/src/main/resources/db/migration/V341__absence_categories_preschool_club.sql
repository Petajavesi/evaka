CREATE OR REPLACE FUNCTION absence_categories(type placement_type) RETURNS absence_category[] AS $$
SELECT CASE type
    WHEN 'CLUB' THEN '{NONBILLABLE}'
    WHEN 'SCHOOL_SHIFT_CARE' THEN '{NONBILLABLE}'
    WHEN 'PRESCHOOL' THEN '{NONBILLABLE}'
    WHEN 'PREPARATORY' THEN '{NONBILLABLE}'
    WHEN 'PRESCHOOL_DAYCARE' THEN '{NONBILLABLE, BILLABLE}'
    WHEN 'PRESCHOOL_CLUB' THEN '{NONBILLABLE, BILLABLE}'
    WHEN 'PREPARATORY_DAYCARE' THEN '{NONBILLABLE, BILLABLE}'
    WHEN 'DAYCARE' THEN '{BILLABLE}'
    WHEN 'DAYCARE_PART_TIME' THEN '{BILLABLE}'
    WHEN 'DAYCARE_FIVE_YEAR_OLDS' THEN '{BILLABLE, NONBILLABLE}'
    WHEN 'DAYCARE_PART_TIME_FIVE_YEAR_OLDS' THEN '{BILLABLE, NONBILLABLE}'
    WHEN 'TEMPORARY_DAYCARE' THEN '{}'
    WHEN 'TEMPORARY_DAYCARE_PART_DAY' THEN '{}'
END::absence_category[]
$$ LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;