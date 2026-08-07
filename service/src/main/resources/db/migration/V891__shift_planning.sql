-- SPDX-FileCopyrightText: 2017-2026 City of Espoo
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TYOVUOROSUUNNITTELIJA';

CREATE TABLE shift_plan (
    id uuid PRIMARY KEY DEFAULT ext.uuid_generate_v1mc(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    unit_id uuid NOT NULL REFERENCES daycare (id),
    week_start date NOT NULL,
    CONSTRAINT uniq$shift_plan$unit_week UNIQUE (unit_id, week_start),
    CONSTRAINT check$shift_plan$week_start_is_monday CHECK (extract(isodow FROM week_start) = 1)
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON shift_plan
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_updated_at();

CREATE TABLE shift_plan_shift (
    id uuid PRIMARY KEY DEFAULT ext.uuid_generate_v1mc(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    plan_id uuid NOT NULL REFERENCES shift_plan (id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employee (id),
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    CONSTRAINT check$shift_plan_shift$times CHECK (end_time > start_time)
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON shift_plan_shift
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_updated_at();

CREATE INDEX idx$shift_plan_shift$plan ON shift_plan_shift (plan_id);

CREATE INDEX idx$shift_plan_shift$employee ON shift_plan_shift (employee_id);
