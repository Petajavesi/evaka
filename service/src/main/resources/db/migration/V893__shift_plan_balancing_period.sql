-- SPDX-FileCopyrightText: 2017-2026 City of Espoo
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- Työaikojen kolmen viikon tasoittumisjakso (KVTES liite 5): työvuorosuunnittelun
-- viikkotyöajat käsitellään kolmen viikon jaksoissa, joiden sisällä yli- ja
-- alitukset yleistyöajasta tasoittuvat. Jaksot ovat yksikkökohtaisia, alkavat
-- maanantaista ja kestävät tasan kolme viikkoa (21 päivää), eivätkä ne voi
-- mennä päällekkäin. Jakso luodaan, kun sen sisältämän viikon suunnittelu
-- avataan ensimmäisen kerran, ja uudet jaksot ankkuroidaan olemassa oleviin
-- niin, että yksikön jaksot muodostavat yhtenäisen kolmen viikon rytmin.

CREATE TABLE shift_plan_balancing_period (
    id uuid PRIMARY KEY DEFAULT ext.uuid_generate_v1mc(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    unit_id uuid NOT NULL REFERENCES daycare (id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    CONSTRAINT uniq$shift_plan_balancing_period$unit_start UNIQUE (unit_id, start_date),
    CONSTRAINT check$shift_plan_balancing_period$start_is_monday CHECK (extract(isodow FROM start_date) = 1),
    CONSTRAINT check$shift_plan_balancing_period$three_weeks CHECK (end_date = start_date + 20),
    CONSTRAINT exclude$shift_plan_balancing_period$no_overlaps
        EXCLUDE USING gist (unit_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
);

CREATE TRIGGER set_timestamp BEFORE UPDATE ON shift_plan_balancing_period
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_updated_at();
