-- BallerZ HQ Seed Data
-- Run after schema to populate initial clubs

-- Popular clubs from major leagues (API-Football IDs)
INSERT INTO clubs (api_id, name, short_name, league, country, elo_rating) VALUES
-- Premier League
(33, 'Manchester United', 'MUN', 'Premier League', 'England', 1650),
(34, 'Newcastle United', 'NEW', 'Premier League', 'England', 1620),
(40, 'Liverpool', 'LIV', 'Premier League', 'England', 1780),
(42, 'Arsenal', 'ARS', 'Premier League', 'England', 1750),
(47, 'Tottenham', 'TOT', 'Premier League', 'England', 1680),
(49, 'Chelsea', 'CHE', 'Premier League', 'England', 1640),
(50, 'Manchester City', 'MCI', 'Premier League', 'England', 1850),
(51, 'Brighton', 'BHA', 'Premier League', 'England', 1580),
(52, 'Crystal Palace', 'CRY', 'Premier League', 'England', 1520),
(55, 'Brentford', 'BRE', 'Premier League', 'England', 1540),
-- La Liga
(529, 'Barcelona', 'BAR', 'La Liga', 'Spain', 1800),
(530, 'Atletico Madrid', 'ATM', 'La Liga', 'Spain', 1720),
(531, 'Athletic Club', 'ATH', 'La Liga', 'Spain', 1600),
(532, 'Valencia', 'VAL', 'La Liga', 'Spain', 1550),
(533, 'Villarreal', 'VIL', 'La Liga', 'Spain', 1620),
(536, 'Sevilla', 'SEV', 'La Liga', 'Spain', 1640),
(541, 'Real Madrid', 'RMA', 'La Liga', 'Spain', 1880),
(548, 'Real Sociedad', 'RSO', 'La Liga', 'Spain', 1590),
-- Bundesliga
(157, 'Bayern Munich', 'BAY', 'Bundesliga', 'Germany', 1820),
(165, 'Borussia Dortmund', 'BVB', 'Bundesliga', 'Germany', 1700),
(168, 'Bayer Leverkusen', 'B04', 'Bundesliga', 'Germany', 1680),
(173, 'RB Leipzig', 'RBL', 'Bundesliga', 'Germany', 1650),
(161, 'Wolfsburg', 'WOB', 'Bundesliga', 'Germany', 1540),
(159, 'Hertha Berlin', 'BSC', 'Bundesliga', 'Germany', 1500),
-- Serie A
(487, 'Lazio', 'LAZ', 'Serie A', 'Italy', 1620),
(488, 'Sassuolo', 'SAS', 'Serie A', 'Italy', 1520),
(489, 'AC Milan', 'MIL', 'Serie A', 'Italy', 1700),
(492, 'Napoli', 'NAP', 'Serie A', 'Italy', 1720),
(496, 'Juventus', 'JUV', 'Serie A', 'Italy', 1740),
(497, 'AS Roma', 'ROM', 'Serie A', 'Italy', 1650),
(498, 'Atalanta', 'ATA', 'Serie A', 'Italy', 1640),
(505, 'Inter Milan', 'INT', 'Serie A', 'Italy', 1780),
-- Ligue 1
(79, 'Lille', 'LIL', 'Ligue 1', 'France', 1600),
(80, 'Lyon', 'LYO', 'Ligue 1', 'France', 1620),
(81, 'Marseille', 'MAR', 'Ligue 1', 'France', 1640),
(85, 'Paris Saint Germain', 'PSG', 'Ligue 1', 'France', 1780),
(84, 'Nice', 'NIC', 'Ligue 1', 'France', 1560),
(91, 'Monaco', 'MON', 'Ligue 1', 'France', 1650);

-- Note: Run the data ingestion scripts to get real-time data from APIs
-- This seed data provides a starting point for development
