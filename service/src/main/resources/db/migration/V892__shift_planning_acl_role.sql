-- SPDX-FileCopyrightText: 2017-2026 City of Espoo
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- Uuden enum-arvon käyttö vaatii oman migraation: PostgreSQL ei salli arvon
-- käyttöä samassa transaktiossa, jossa se on lisätty (V891).

ALTER TABLE daycare_acl DROP CONSTRAINT "chk$valid_role";
ALTER TABLE daycare_acl ADD CONSTRAINT "chk$valid_role" CHECK ((role = ANY (ARRAY['UNIT_SUPERVISOR'::user_role,
                                                                                  'STAFF'::user_role,
                                                                                  'SPECIAL_EDUCATION_TEACHER'::user_role,
                                                                                  'EARLY_CHILDHOOD_EDUCATION_SECRETARY'::user_role,
                                                                                  'TYOVUOROSUUNNITTELIJA'::user_role])));

ALTER TABLE daycare_acl_schedule DROP CONSTRAINT "chk$valid_role";
ALTER TABLE daycare_acl_schedule ADD CONSTRAINT "chk$valid_role" CHECK ((role = ANY (ARRAY['UNIT_SUPERVISOR'::user_role,
                                                                                           'STAFF'::user_role,
                                                                                           'SPECIAL_EDUCATION_TEACHER'::user_role,
                                                                                           'EARLY_CHILDHOOD_EDUCATION_SECRETARY'::user_role,
                                                                                           'TYOVUOROSUUNNITTELIJA'::user_role])));
