-- SPDX-FileCopyrightText: 2017-2026 City of Espoo
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- Työvuorosuunnittelun testidata: 30 testilasta sijoituksineen ja varausaikoineen
-- yksikköön "Päiväkoti ja esikoulu A" (dev-data.sql).
--
-- Lapset 1-10: alle 3-vuotiaita (Ryhmä 1), lapset 11-30: 3 vuotta täyttäneitä (Ryhmä 2).
-- Päivämäärät lasketaan suhteessa kuluvaan päivään, joten data ei vanhene.

INSERT INTO evaka_user (id, type, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'SYSTEM', 'eVaka')
ON CONFLICT (id) DO NOTHING;

INSERT INTO person (id, first_name, last_name, date_of_birth)
SELECT ('00000000-0000-4000-8000-0000000010' || lpad(i::text, 2, '0'))::uuid,
       (ARRAY ['Aada','Eino','Aino','Onni','Ella','Väinö','Sofia','Leo','Emma','Elias',
               'Venla','Oliver','Lilja','Eeli','Helmi','Niilo','Ellen','Toivo','Isla','Otso',
               'Pihla','Aatos','Enni','Emil','Saana','Hugo','Vilja','Alvar','Kerttu','Usko'])[i],
       'Testilä',
       CASE
           WHEN i <= 10
               -- 1v 1kk ... 1v 11kk: pysyy alle 3-vuotiaana
               THEN (current_date - interval '1 year' - make_interval(days => i * 30))::date
           -- 3v 1kk ... 5v 3kk
           ELSE (current_date - interval '3 years' - make_interval(days => (i - 10) * 40))::date
           END
FROM generate_series(1, 30) AS i;

INSERT INTO child (id)
SELECT ('00000000-0000-4000-8000-0000000010' || lpad(i::text, 2, '0'))::uuid
FROM generate_series(1, 30) AS i;

INSERT INTO placement (id, created_at, type, child_id, unit_id, start_date, end_date, place_guarantee)
SELECT ('00000000-0000-4000-8000-0000000020' || lpad(i::text, 2, '0'))::uuid,
       now(),
       'DAYCARE'::placement_type,
       ('00000000-0000-4000-8000-0000000010' || lpad(i::text, 2, '0'))::uuid,
       '2dcf0fc0-788e-11e9-bd12-db78e886e666', -- Päiväkoti ja esikoulu A
       (current_date - interval '6 months')::date,
       (current_date + interval '1 year')::date,
       false
FROM generate_series(1, 30) AS i;

INSERT INTO daycare_group_placement (daycare_placement_id, daycare_group_id, start_date, end_date)
SELECT ('00000000-0000-4000-8000-0000000020' || lpad(i::text, 2, '0'))::uuid,
       CASE
           WHEN i <= 10 THEN '6f82b730-5963-11ea-b4d8-6f19186c8118'::uuid -- Ryhmä 1
           ELSE 'b4bd39f6-5963-11ea-b4da-ebed8135a791'::uuid              -- Ryhmä 2
           END,
       (current_date - interval '6 months')::date,
       (current_date + interval '1 year')::date
FROM generate_series(1, 30) AS i;

-- Varausajat edellisen, kuluvan ja seuraavan viikon arkipäiville (ma-pe) satunnaisin
-- kellonajoin. Tulo arvotaan väliltä 06:30-09:00 ja lähtö väliltä 14:00-17:00
-- (30 min välein), ja noin joka kymmenes lapsi-päivä-pari jätetään satunnaisesti pois,
-- jotta päivien ja lasten välille syntyy vaihtelua. Tulo on aina ennen lähtöä
-- (max tulo < min lähtö). Edellinen viikko tarvitaan toteumavertailun testaamiseen.
INSERT INTO attendance_reservation (child_id, created_by, date, start_time, end_time)
SELECT ('00000000-0000-4000-8000-0000000010' || lpad(i::text, 2, '0'))::uuid,
       '00000000-0000-0000-0000-000000000000',
       date_trunc('week', current_date)::date + day_offset,
       '06:30'::time + (floor(random() * 6) * interval '30 minutes'),
       '14:00'::time + (floor(random() * 7) * interval '30 minutes')
FROM generate_series(1, 30) AS i,
     unnest(ARRAY [-7, -6, -5, -4, -3, 0, 1, 2, 3, 4, 7, 8, 9, 10, 11]) AS day_offset
WHERE random() > 0.1;

-- Tuen tieto (korotettu kerroin) yhdelle alle 3-vuotiaalle ja yhdelle yli 3-vuotiaalle
INSERT INTO assistance_factor (child_id, modified_at, modified_by, valid_during, capacity_factor)
SELECT ('00000000-0000-4000-8000-0000000010' || lpad(i::text, 2, '0'))::uuid,
       now(),
       '00000000-0000-0000-0000-000000000000',
       daterange((current_date - interval '1 month')::date, (current_date + interval '3 months')::date, '[)'),
       2.00
FROM unnest(ARRAY [5, 15]) AS i;

-- Tuen tasot (daycare_assistance) neljälle lapselle: yleinen, tehostettu ja erityinen tuki
INSERT INTO daycare_assistance (child_id, modified, modified_by, valid_during, level)
SELECT ('00000000-0000-4000-8000-0000000010' || lpad(i::text, 2, '0'))::uuid,
       now(),
       '00000000-0000-0000-0000-000000000000',
       daterange((current_date - interval '1 month')::date, (current_date + interval '3 months')::date, '[)'),
       level::daycare_assistance_level
FROM (VALUES (5, 'INTENSIFIED_SUPPORT'),
             (15, 'SPECIAL_SUPPORT'),
             (8, 'GENERAL_SUPPORT'),
             (22, 'INTENSIFIED_SUPPORT')) AS v(i, level);

-- Henkilöstöä työvuoroihin kohdennettavaksi: 10 kasvattajaa yksikköön "Päiväkoti ja esikoulu A".
-- external_id lisää kasvattajat devausympäristön AD-kirjautumislistaan, jotta
-- heillä voi kirjautua esim. työvuorotoiveiden testaamiseksi.
INSERT INTO employee (id, external_id, first_name, last_name, email, active)
SELECT ('00000000-0000-4000-8000-0000000030' || lpad(i::text, 2, '0'))::uuid,
       'espoo-ad:00000000-0000-4000-8000-0000000030' || lpad(i::text, 2, '0'),
       (ARRAY ['Aino','Maija','Tuula','Pekka','Ville','Liisa','Antti','Sanna','Jukka','Elina'])[i],
       'Hoitaja',
       lower((ARRAY ['aino','maija','tuula','pekka','ville','liisa','antti','sanna','jukka','elina'])[i]) || '.hoitaja@petajavesi.fi',
       TRUE
FROM generate_series(1, 10) AS i
ON CONFLICT (id) DO NOTHING;

INSERT INTO evaka_user (id, type, employee_id, name)
SELECT ('00000000-0000-4000-8000-0000000030' || lpad(i::text, 2, '0'))::uuid,
       'EMPLOYEE',
       ('00000000-0000-4000-8000-0000000030' || lpad(i::text, 2, '0'))::uuid,
       'Hoitaja ' || (ARRAY ['Aino','Maija','Tuula','Pekka','Ville','Liisa','Antti','Sanna','Jukka','Elina'])[i]
FROM generate_series(1, 10) AS i
ON CONFLICT (id) DO NOTHING;

INSERT INTO daycare_acl (daycare_id, employee_id, role)
SELECT '2dcf0fc0-788e-11e9-bd12-db78e886e666',
       ('00000000-0000-4000-8000-0000000030' || lpad(i::text, 2, '0'))::uuid,
       'STAFF'
FROM generate_series(1, 10) AS i
ON CONFLICT DO NOTHING;

-- Toteutuneet työajat: sisään/ulos-leimaukset (eVaka-mobiilin staff_attendance_realtime)
-- edellisen, kuluvan ja seuraavan viikon arkipäiville kaikille kymmenelle kasvattajalle
-- (kuvitteelliset tulevat leimaukset helpottavat tasoittumisjakson testaamista).
-- Sisäänleimaus arvotaan väliltä 06:30-08:30 ja ulosleimaus väliltä 14:00-16:30 minuutin
-- tarkkuudella, jotta toteuma ei osu tasan suunnittelun 15 min aikaväleihin.
-- Kasvattajat 1-5 leimaavat Ryhmään 1 ja 6-10 Ryhmään 2.
INSERT INTO staff_attendance_realtime (employee_id, group_id, arrived, departed, occupancy_coefficient, type)
SELECT ('00000000-0000-4000-8000-0000000030' || lpad(i::text, 2, '0'))::uuid,
       CASE WHEN i <= 5 THEN '6f82b730-5963-11ea-b4d8-6f19186c8118'::uuid -- Ryhmä 1
            ELSE 'b4bd39f6-5963-11ea-b4da-ebed8135a791'::uuid             -- Ryhmä 2
            END,
       ((date_trunc('week', current_date)::date + day_offset)::timestamp
         + interval '6 hours 30 minutes' + (floor(random() * 121) * interval '1 minute')) AT TIME ZONE 'Europe/Helsinki',
       ((date_trunc('week', current_date)::date + day_offset)::timestamp
         + interval '14 hours' + (floor(random() * 151) * interval '1 minute')) AT TIME ZONE 'Europe/Helsinki',
       7.00,
       'PRESENT'
FROM generate_series(1, 10) AS i,
     unnest(ARRAY [-7, -6, -5, -4, -3, 0, 1, 2, 3, 4, 7, 8, 9, 10, 11]) AS day_offset;

-- Työvuorotoiveet: satunnaisia toiveita kymmenelle kasvattajalle seuraavalle
-- neljälle viikolle seuraavasta maanantaista alkaen. Työntekijän toiveikkuna
-- kattaa kolme ensimmäistä; neljäs viikko siirtyy ikkunaan viikon kuluttua ja
-- näkyy suunnittelijalle heti viikkoa selattaessa. Alkuajat 06:30-09:30 ja
-- kestot 6-9 h 15 minuutin välein (suunnittelun aikaväli). Arkipäiville
-- toiveita syntyy useammin kuin viikonlopuille.
INSERT INTO shift_wish (employee_id, unit_id, date, start_time, end_time)
SELECT employee_id, unit_id, date, start_time, start_time + duration
FROM (SELECT ('00000000-0000-4000-8000-0000000030' || lpad(i::text, 2, '0'))::uuid AS employee_id,
             '2dcf0fc0-788e-11e9-bd12-db78e886e666'::uuid                          AS unit_id,
             (date_trunc('week', current_date)::date + 7 + w * 7 + d)              AS date,
             ('06:30'::time + floor(random() * 13) * interval '15 minutes')        AS start_time,
             (interval '6 hours' + floor(random() * 13) * interval '15 minutes')   AS duration,
             d
      FROM generate_series(1, 10) AS i,
           generate_series(0, 3) AS w,
           generate_series(0, 6) AS d) AS x
WHERE random() < CASE WHEN d < 5 THEN 0.30 ELSE 0.10 END
ON CONFLICT DO NOTHING;

-- Päällekkäiset toiveet värikorostuksen testaamiseen: joka viikolle yksi
-- "suosittu" vuoro, jota 3-4 kasvattajaa toivoo täsmälleen samoin ajoin
-- (sama päivä ja kellonajat -> suunnittelijan näkymä ryhmittelee ne värillä)
INSERT INTO shift_wish (employee_id, unit_id, date, start_time, end_time)
SELECT ('00000000-0000-4000-8000-0000000030' || lpad(i::text, 2, '0'))::uuid,
       '2dcf0fc0-788e-11e9-bd12-db78e886e666'::uuid,
       (date_trunc('week', current_date)::date + 7 + w * 7 + w),
       '07:30'::time + w * interval '30 minutes',
       '15:00'::time + w * interval '30 minutes'
FROM generate_series(0, 3) AS w,
     generate_series(1, 3 + (w % 2)) AS i
ON CONFLICT DO NOTHING;
