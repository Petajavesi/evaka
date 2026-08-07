-- SPDX-FileCopyrightText: 2017-2026 City of Espoo
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- Työntekijöiden työvuorotoiveet (Petäjäveden työvuorosuunnittelu-lisäosa):
-- työntekijä toivoo vuoroja seuraavalle kolmelle viikolle, ja
-- työvuorosuunnittelija hyväksyy, hylkää tai muuttaa toiveen.
-- Hyväksytyt kellonajat tallennetaan resolved_start_time/resolved_end_time-
-- sarakkeisiin, jotta alkuperäinen toive säilyy näkyvissä.

CREATE TYPE shift_wish_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE shift_wish (
    id uuid PRIMARY KEY DEFAULT ext.uuid_generate_v1mc(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    employee_id uuid NOT NULL REFERENCES employee (id),
    unit_id uuid NOT NULL REFERENCES daycare (id),
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    status shift_wish_status NOT NULL DEFAULT 'PENDING',
    resolved_by uuid REFERENCES employee (id),
    resolved_at timestamp with time zone,
    resolved_start_time time,
    resolved_end_time time,
    CONSTRAINT check$shift_wish$times CHECK (end_time > start_time),
    CONSTRAINT check$shift_wish$resolved_times
        CHECK (resolved_end_time IS NULL OR resolved_start_time IS NULL OR resolved_end_time > resolved_start_time),
    CONSTRAINT uniq$shift_wish$employee_slot UNIQUE (employee_id, unit_id, date, start_time, end_time)
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON shift_wish
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_updated_at();

CREATE INDEX idx$shift_wish$unit_date ON shift_wish (unit_id, date);

CREATE INDEX idx$shift_wish$employee ON shift_wish (employee_id);
