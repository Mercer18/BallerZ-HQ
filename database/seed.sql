-- BallerZ HQ Seed Data
-- Run after schema to populate initial clubs
-- NOTE: This seed is for dev bootstrapping only. Production clubs are
-- created automatically by the CSV ingest pipeline (data_ingest.py).

-- Popular clubs from major leagues (API-Football IDs)
INSERT INTO clubs (api_id, name, short_name, league, country) VALUES
-- Premier League
(33, 'Manchester United', 'MUN', 'Premier League', 'England'),
(34, 'Newcastle United', 'NEW', 'Premier League', 'England'),
(40, 'Liverpool', 'LIV', 'Premier League', 'England'),
(42, 'Arsenal', 'ARS', 'Premier League', 'England'),
(47, 'Tottenham', 'TOT', 'Premier League', 'England'),
(49, 'Chelsea', 'CHE', 'Premier League', 'England'),
(50, 'Manchester City', 'MCI', 'Premier League', 'England'),
(51, 'Brighton', 'BHA', 'Premier League', 'England'),
(52, 'Crystal Palace', 'CRY', 'Premier League', 'England'),
(55, 'Brentford', 'BRE', 'Premier League', 'England'),
-- La Liga
(529, 'Barcelona', 'BAR', 'La Liga', 'Spain'),
(530, 'Atletico Madrid', 'ATM', 'La Liga', 'Spain'),
(531, 'Athletic Club', 'ATH', 'La Liga', 'Spain'),
(532, 'Valencia', 'VAL', 'La Liga', 'Spain'),
(533, 'Villarreal', 'VIL', 'La Liga', 'Spain'),
(536, 'Sevilla', 'SEV', 'La Liga', 'Spain'),
(541, 'Real Madrid', 'RMA', 'La Liga', 'Spain'),
(548, 'Real Sociedad', 'RSO', 'La Liga', 'Spain'),
-- Bundesliga
(157, 'Bayern Munich', 'BAY', 'Bundesliga', 'Germany'),
(165, 'Borussia Dortmund', 'BVB', 'Bundesliga', 'Germany'),
(168, 'Bayer Leverkusen', 'B04', 'Bundesliga', 'Germany'),
(173, 'RB Leipzig', 'RBL', 'Bundesliga', 'Germany'),
(161, 'Wolfsburg', 'WOB', 'Bundesliga', 'Germany'),
(159, 'Hertha Berlin', 'BSC', 'Bundesliga', 'Germany'),
-- Serie A
(487, 'Lazio', 'LAZ', 'Serie A', 'Italy'),
(488, 'Sassuolo', 'SAS', 'Serie A', 'Italy'),
(489, 'AC Milan', 'MIL', 'Serie A', 'Italy'),
(492, 'Napoli', 'NAP', 'Serie A', 'Italy'),
(496, 'Juventus', 'JUV', 'Serie A', 'Italy'),
(497, 'AS Roma', 'ROM', 'Serie A', 'Italy'),
(498, 'Atalanta', 'ATA', 'Serie A', 'Italy'),
(505, 'Inter Milan', 'INT', 'Serie A', 'Italy'),
-- Ligue 1
(79, 'Lille', 'LIL', 'Ligue 1', 'France'),
(80, 'Lyon', 'LYO', 'Ligue 1', 'France'),
(81, 'Marseille', 'MAR', 'Ligue 1', 'France'),
(85, 'Paris Saint Germain', 'PSG', 'Ligue 1', 'France'),
(84, 'Nice', 'NIC', 'Ligue 1', 'France'),
(91, 'Monaco', 'MON', 'Ligue 1', 'France');
