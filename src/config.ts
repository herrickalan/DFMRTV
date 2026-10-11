const fromEnv = (value: string | undefined, fallback = '') => value?.trim() || fallback;

export const station = {
  name: 'DFM RTV International',
  shortName: 'DFM',
  frequency: 'Radio • International',
  tagline: 'Your sound. Your stories. Everywhere.',
  streamUrl: fromEnv(process.env.EXPO_PUBLIC_DFM_STREAM_URL, 'http://dfm.nu/DFM_RTV_INT_1.m3u'),
  websiteUrl: fromEnv(process.env.EXPO_PUBLIC_DFM_WEBSITE_URL, 'https://dfm.nu'),
  facebookUrl: fromEnv(process.env.EXPO_PUBLIC_DFM_FACEBOOK_URL, 'https://www.facebook.com/dfm.rtv/'),
  discordUrl: fromEnv(process.env.EXPO_PUBLIC_DFM_DISCORD_URL, 'https://discord.com/invite/FRsN2pH'),
  secondLifeUrl: fromEnv(process.env.EXPO_PUBLIC_DFM_SECONDLIFE_URL, 'https://dfm.nu/secondlife/'),
};

export const hasLiveStream = /^https?:\/\//i.test(station.streamUrl);
