-- SPDX-FileCopyrightText: 2017-2026 City of Espoo
--
-- SPDX-License-Identifier: LGPL-2.1-or-later

-- Tärkeä työvuorotoive (tähdellä merkitty): työntekijä voi merkitä enintään
-- kaksi toivetta tärkeäksi kolmen viikon toiveikkunassa. Raja valvotaan
-- sovelluksessa toiveen luonnin yhteydessä.

ALTER TABLE shift_wish
    ADD COLUMN important boolean NOT NULL DEFAULT false;
