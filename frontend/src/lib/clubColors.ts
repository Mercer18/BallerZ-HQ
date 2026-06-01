/**
 * Club → primary brand color mapping.
 * Used to tint the dashboard and personalise the UI around the user's favorite club.
 * Falls back to our default accent-emerald (#10b981) for unmapped clubs.
 */

export const CLUB_COLORS: Record<string, string> = {
  // Premier League
  'Arsenal':            '#EF0107',
  'Aston Villa':        '#670E36',
  'Bournemouth':        '#DA291C',
  'Brentford':          '#E30613',
  'Brighton':           '#0057B8',
  'Burnley':            '#6C1D45',
  'Chelsea':            '#034694',
  'Crystal Palace':     '#1B458F',
  'Everton':            '#003399',
  'Fulham':             '#CC0000',
  'Leeds':              '#FFCD00',
  'Leicester':          '#003090',
  'Liverpool':          '#C8102E',
  'Manchester City':    '#6CABDD',
  'Manchester United':  '#DA291C',
  'Newcastle':          '#241F20',
  'Norwich':            '#FFF200',
  'Nottingham Forest':  '#DD0000',
  'Sheffield United':   '#EE2737',
  'Southampton':        '#D71920',
  'Tottenham':          '#132257',
  'Watford':            '#FBEE23',
  'West Brom':          '#122F67',
  'West Ham':           '#7A263A',
  'Wolverhampton':      '#FDB913',

  // La Liga
  'Barcelona':          '#A50044',
  'Real Madrid':        '#00529F',
  'Atletico Madrid':    '#CB3524',
  'Sevilla':            '#D4021D',
  'Real Betis':         '#00954C',
  'Real Sociedad':      '#143C8B',
  'Villarreal':         '#FFE114',
  'Athletic Bilbao':    '#EE2523',
  'Valencia':           '#EE3524',
  'Celta Vigo':         '#8AC3EE',
  'Espanyol':           '#007FC8',
  'Getafe':             '#004FA3',
  'Granada':            '#EE1119',
  'Osasuna':            '#0A346F',
  'Mallorca':           '#E20613',
  'Rayo Vallecano':     '#E53027',
  'Cadiz':              '#FFD200',
  'Elche':              '#1A642A',
  'Alaves':             '#003DA5',
  'Levante':            '#284998',

  // Serie A
  'Inter':              '#009DE0',
  'AC Milan':           '#FB090B',
  'Juventus':           '#000000',
  'Napoli':             '#12A0D7',
  'Roma':               '#F0BC42',
  'Lazio':              '#87D8F7',
  'Atalanta':           '#1E71B8',
  'Fiorentina':         '#482B80',
  'Bologna':            '#1A2F48',
  'Torino':             '#8B0000',
  'Udinese':            '#000000',
  'Sassuolo':           '#00A850',
  'Sampdoria':          '#005BAC',
  'Verona':             '#FFED00',
  'Genoa':              '#A71930',
  'Cagliari':           '#6D2C41',
  'Spezia':             '#000000',
  'Empoli':             '#00529C',
  'Salernitana':        '#8B1A2D',
  'Venezia':            '#FC6600',
  'Monza':              '#C4161C',
  'Lecce':              '#F7D117',
  'Frosinone':          '#FFED00',
  'Como':               '#003DA5',

  // Bundesliga
  'Bayern Munich':      '#DC052D',
  'Dortmund':           '#FDE100',
  'RB Leipzig':         '#DD0741',
  'Leverkusen':         '#E32221',
  'Union Berlin':       '#EB1923',
  'Freiburg':           '#000000',
  'Eintracht Frankfurt':'#E1000F',
  'Wolfsburg':          '#65B32E',
  'Mainz':              '#ED1C24',
  'Hoffenheim':         '#1961B5',
  'Monchengladbach':    '#000000',
  'Koln':               '#ED1C24',
  'Hertha Berlin':      '#005CA9',
  'Augsburg':           '#BA3733',
  'Stuttgart':          '#E32219',
  'Werder Bremen':      '#1D9053',
  'Bochum':             '#005BA5',
  'Schalke':            '#004D9D',
  'Heidenheim':         '#E30613',
  'Darmstadt':          '#004E9F',

  // Ligue 1
  'Paris SG':           '#004170',
  'Marseille':          '#2FAEE0',
  'Lyon':               '#24408E',
  'Monaco':             '#E7001E',
  'Lille':              '#E3001B',
  'Nice':               '#000000',
  'Rennes':             '#E4002B',
  'Lens':               '#FDD308',
  'Strasbourg':         '#009FE3',
  'Nantes':             '#FCDD09',
  'Montpellier':        '#FF6900',
  'Toulouse':           '#7B2D8E',
  'Brest':              '#E4002B',
  'Reims':              '#B9001F',
  'Le Havre':           '#00A3E0',
  'Clermont':           '#C8102E',
  'Lorient':            '#F68C2C',
  'Metz':               '#811331',
  'Ajaccio':            '#C8102E',
  'Auxerre':            '#FFFFFF',
  'Angers':             '#000000',
  'Bordeaux':           '#13294B',
  'Saint-Etienne':      '#00824A',
  'Dijon':              '#E31B23',
}

/** Default accent color when club is not in the map */
export const DEFAULT_CLUB_COLOR = '#10b981'

/**
 * Get the primary brand color for a club.
 * Returns hex string (e.g. "#C8102E" for Liverpool).
 */
export function getClubColor(clubName: string | null | undefined): string {
  if (!clubName) return DEFAULT_CLUB_COLOR
  return CLUB_COLORS[clubName] ?? DEFAULT_CLUB_COLOR
}

/**
 * Convert hex to RGB values for use in CSS rgb() / rgba() functions.
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '16, 185, 129' // fallback emerald
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}
