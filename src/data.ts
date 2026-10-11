export type Program = {
  id: string;
  title: string;
  host: string;
  start: string;
  end: string;
  category: string;
};

export type Story = {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  published: string;
  accent: string;
};

// Seed content keeps the prototype useful offline. Replace with the station CMS/API.
export const programs: Program[] = [
  { id: 'wake-up', title: 'DFM Wake Up', host: 'The morning team', start: '06:00', end: '10:00', category: 'Morning' },
  { id: 'midday', title: 'The Midday Mix', host: 'DFM Radio', start: '10:00', end: '14:00', category: 'Music' },
  { id: 'drive', title: 'Drive Time', host: 'The afternoon team', start: '14:00', end: '18:00', category: 'Talk & music' },
  { id: 'evening', title: 'After Hours', host: 'DFM Radio', start: '18:00', end: '22:00', category: 'Music' },
  { id: 'night', title: 'Night Stream', host: 'Non-stop DFM', start: '22:00', end: '06:00', category: 'Non-stop' },
];

export const stories: Story[] = [
  {
    id: 'community',
    kicker: 'COMMUNITY',
    title: 'Stay connected with DFM wherever you are',
    summary: 'Listen live, follow the latest stories and keep your favorite programs close.',
    published: 'Today',
    accent: '#FF5C5C',
  },
  {
    id: 'studio',
    kicker: 'FROM THE STUDIO',
    title: 'The voices and music that move your day',
    summary: 'Meet the shows, music and conversations broadcasting throughout the week.',
    published: 'This week',
    accent: '#46D7C8',
  },
  {
    id: 'international',
    kicker: 'INTERNATIONAL',
    title: 'DFM travels with you',
    summary: 'A single home for listeners at home and across the world.',
    published: 'Explore',
    accent: '#FFD23F',
  },
];

export const week = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function programForNow(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return programs.find((program) => {
    const [startHours = 0, startMinutes = 0] = program.start.split(':').map(Number);
    const [endHours = 0, endMinutes = 0] = program.end.split(':').map(Number);
    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;
    return end <= start ? minutes >= start || minutes < end : minutes >= start && minutes < end;
  }) ?? programs[0]!;
}
