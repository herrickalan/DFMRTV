import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { hasLiveStream, station } from './src/config';
import { Program, programs, programForNow, stories, Story, week } from './src/data';
import { colors, radii, space } from './src/theme';

type Tab = 'home' | 'live' | 'schedule' | 'more';
type PlayerState = { isPlaying: boolean; toggle: () => void };

const openUrl = async (url: string) => {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', 'Please try again in a moment.');
  }
};

async function resolveStreamUrl(url: string) {
  if (!/\.m3u(?:$|\?)/i.test(url)) return url;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Playlist request failed with ${response.status}`);
  const playlist = await response.text();
  const entry = playlist
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('#'));

  if (!entry) throw new Error('The DFM playlist does not contain a stream URL');
  return new URL(entry, url).toString();
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.logoRow} accessibilityLabel="DFM RTV International">
      <View style={[styles.logoMark, compact && styles.logoMarkCompact]}>
        <Text style={[styles.logoText, compact && styles.logoTextCompact]}>DFM</Text>
        <View style={styles.logoStripe} />
      </View>
      {!compact && (
        <View>
          <Text style={styles.logoRtv}>RTV</Text>
          <Text style={styles.logoInternational}>INTERNATIONAL</Text>
        </View>
      )}
    </View>
  );
}

function PlayButton({ isPlaying, onPress, size = 68 }: { isPlaying: boolean; onPress: () => void; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause live radio' : 'Play live radio'}
      style={({ pressed }) => [
        styles.playButton,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
    >
      {isPlaying ? (
        <View style={styles.pauseIcon}>
          <View style={styles.pauseBar} />
          <View style={styles.pauseBar} />
        </View>
      ) : (
        <View style={styles.playTriangle} />
      )}
    </Pressable>
  );
}

function Header({ title }: { title?: string }) {
  return (
    <View style={styles.header}>
      {title ? <Text style={styles.pageTitle}>{title}</Text> : <Logo />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open station website"
        onPress={() => openUrl(station.websiteUrl)}
        style={({ pressed }) => [styles.webButton, pressed && styles.pressed]}
      >
        <Text style={styles.webButtonText}>dfm.nu</Text>
        <Text style={styles.arrow}>↗</Text>
      </Pressable>
    </View>
  );
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}  →</Text>
        </Pressable>
      )}
    </View>
  );
}

function HomeScreen({ player, onTab, onStory }: { player: PlayerState; onTab: (tab: Tab) => void; onStory: (story: Story) => void }) {
  const current = useMemo(() => programForNow(), []);
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header />
      <LinearGradient colors={['#1B3D5F', '#0F2238', colors.inkLifted]} style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>LIVE NOW</Text>
        </View>
        <Text style={styles.heroEyebrow}>LISTEN TO DFM RADIO</Text>
        <Text style={styles.heroTitle}>{current.title}</Text>
        <Text style={styles.heroMeta}>{current.start}—{current.end}  ·  {current.host}</Text>
        <View style={styles.heroPlayerRow}>
          <PlayButton isPlaying={player.isPlaying} onPress={player.toggle} />
          <View style={styles.equalizer} accessibilityElementsHidden>
            {[16, 32, 22, 39, 28, 15, 34, 24, 38, 18, 31].map((height, index) => (
              <View key={index} style={[styles.equalizerBar, { height }]} />
            ))}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.quickRow}>
        <Pressable onPress={() => onTab('live')} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
          <View style={[styles.quickIcon, { backgroundColor: colors.yellow }]}><Text style={styles.quickIconText}>▶</Text></View>
          <View style={styles.flex}>
            <Text style={styles.quickLabel}>LISTEN</Text>
            <Text style={styles.quickTitle}>Live radio</Text>
          </View>
          <Text style={styles.quickArrow}>›</Text>
        </Pressable>
      </View>

      <SectionHeading title="Latest from DFM" action="All stories" />
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storyList}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => onStory(item)} style={({ pressed }) => [styles.storyCard, pressed && styles.pressed]}>
            <LinearGradient colors={[item.accent, `${item.accent}99`]} style={styles.storyArt}>
              <Text style={styles.storyNumber}>0{index + 1}</Text>
              <View style={styles.storyArtCircle} />
              <Logo compact />
            </LinearGradient>
            <View style={styles.storyCopy}>
              <Text style={[styles.storyKicker, { color: item.accent }]}>{item.kicker}</Text>
              <Text style={styles.storyTitle} numberOfLines={3}>{item.title}</Text>
              <Text style={styles.storyPublished}>{item.published}</Text>
            </View>
          </Pressable>
        )}
      />

      <SectionHeading title="Coming up" action="Full schedule" onAction={() => onTab('schedule')} />
      <View style={styles.schedulePreview}>
        {programs.slice(1, 4).map((program, index) => (
          <ProgramRow key={program.id} program={program} last={index === 2} />
        ))}
      </View>
      <View style={styles.homeBottomSpace} />
    </ScrollView>
  );
}

function AnimatedSignal({ active }: { active: boolean }) {
  const animation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      animation.stopAnimation();
      animation.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(animation, { toValue: 1, duration: 850, useNativeDriver: true }),
      Animated.timing(animation, { toValue: 0, duration: 850, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, animation]);
  const scale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.1] });
  const opacity = animation.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0.08] });
  return <Animated.View style={[styles.signalRing, { opacity, transform: [{ scale }] }]} />;
}

function LiveScreen({ player }: { player: PlayerState }) {
  const current = useMemo(() => programForNow(), []);
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header title="Live" />
      <View>
        <LinearGradient colors={['#193D5B', '#0A1727']} style={styles.liveStage}>
          <AnimatedSignal active={player.isPlaying} />
          <View style={styles.discOuter}>
            <View style={styles.discInner}>
              <Logo compact />
            </View>
          </View>
          <Text style={styles.onAir}>ON AIR</Text>
          <Text style={styles.liveTitle}>{current.title}</Text>
          <Text style={styles.liveHost}>{current.host}</Text>
          <PlayButton isPlaying={player.isPlaying} onPress={player.toggle} size={78} />
          <Text style={styles.streamHint}>{player.isPlaying ? 'Streaming live' : 'Tap to listen'}</Text>
        </LinearGradient>
        <View style={styles.nowCard}>
          <View>
            <Text style={styles.nowLabel}>NOW</Text>
            <Text style={styles.nowTitle}>{current.title}</Text>
            <Text style={styles.nowMeta}>{current.start}—{current.end}</Text>
          </View>
          <View style={styles.nowDivider} />
          <View style={styles.flex}>
            <Text style={styles.nowLabel}>NEXT</Text>
            <Text style={styles.nowTitle}>{programs[1]?.title}</Text>
            <Text style={styles.nowMeta}>{programs[1]?.start}</Text>
          </View>
        </View>
      </View>
      <View style={styles.homeBottomSpace} />
    </ScrollView>
  );
}

function ProgramRow({ program, last = false }: { program: Program; last?: boolean }) {
  return (
    <View style={[styles.programRow, !last && styles.programBorder]}>
      <View style={styles.programTime}>
        <Text style={styles.programStart}>{program.start}</Text>
        <Text style={styles.programEnd}>{program.end}</Text>
      </View>
      <View style={styles.programLine}><View style={styles.programDot} /></View>
      <View style={styles.programCopy}>
        <Text style={styles.programTitle}>{program.title}</Text>
        <Text style={styles.programHost}>{program.host}</Text>
        <View style={styles.categoryPill}><Text style={styles.categoryText}>{program.category}</Text></View>
      </View>
    </View>
  );
}

function ScheduleScreen() {
  const jsDay = new Date().getDay();
  const defaultDay = jsDay === 0 ? 6 : jsDay - 1;
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header title="Schedule" />
      <Text style={styles.pageIntro}>Find your favorite program and tune in right on time.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
        {week.map((day, index) => (
          <Pressable key={day} onPress={() => setSelectedDay(index)} style={[styles.dayButton, selectedDay === index && styles.dayButtonActive]}>
            <Text style={[styles.dayText, selectedDay === index && styles.dayTextActive]}>{day}</Text>
            {selectedDay === index && <View style={styles.dayIndicator} />}
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.scheduleHeaderRow}>
        <Text style={styles.scheduleDayTitle}>{selectedDay === defaultDay ? 'Today' : week[selectedDay]}</Text>
        <Text style={styles.scheduleTimezone}>LOCAL TIME</Text>
      </View>
      <View style={styles.scheduleCard}>
        {programs.map((program, index) => <ProgramRow key={program.id} program={program} last={index === programs.length - 1} />)}
      </View>
      <Text style={styles.seedNote}>Program times shown are sample content until the DFM schedule feed is connected.</Text>
      <View style={styles.homeBottomSpace} />
    </ScrollView>
  );
}

function LinkRow({ icon, title, subtitle, color, url }: { icon: string; title: string; subtitle: string; color: string; url: string }) {
  const enabled = Boolean(url);
  return (
    <Pressable
      disabled={!enabled}
      onPress={() => openUrl(url)}
      style={({ pressed }) => [styles.linkRow, !enabled && styles.linkDisabled, pressed && styles.pressed]}
    >
      <View style={[styles.linkIcon, { backgroundColor: color }]}><Text style={styles.linkIconText}>{icon}</Text></View>
      <View style={styles.flex}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkSubtitle}>{enabled ? subtitle : 'Add link in .env'}</Text>
      </View>
      <Text style={styles.linkChevron}>›</Text>
    </Pressable>
  );
}

function MoreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header title="Connect" />
      <LinearGradient colors={['#1F405D', '#10253B']} style={styles.connectHero}>
        <Logo />
        <Text style={styles.connectTitle}>DFM goes wherever you go.</Text>
        <Text style={styles.connectCopy}>Radio and stories for our community at home and around the world.</Text>
      </LinearGradient>
      <Text style={styles.groupLabel}>OFFICIAL CHANNELS</Text>
      <View style={styles.linksCard}>
        <LinkRow icon="W" title="Website" subtitle="Visit dfm.nu" color={colors.yellow} url={station.websiteUrl} />
        <LinkRow icon="f" title="Facebook" subtitle="Follow DFM" color="#5B8DEF" url={station.facebookUrl} />
        <LinkRow icon="D" title="Discord" subtitle="Join the DFM community" color="#8C9EFF" url={station.discordUrl} />
        <LinkRow icon="SL" title="Second Life" subtitle="Visit DFM in Second Life" color={colors.aqua} url={station.secondLifeUrl} />
      </View>
      <Text style={styles.groupLabel}>ABOUT</Text>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>DFM RTV International</Text>
        <Text style={styles.aboutCopy}>A focused, mobile-first home for the DFM community. Built for reliable listening with a fast path to schedules, station stories and community channels.</Text>
        <View style={styles.versionRow}><Text style={styles.versionLabel}>APP VERSION</Text><Text style={styles.version}>1.0.0</Text></View>
      </View>
      <View style={styles.homeBottomSpace} />
    </ScrollView>
  );
}

function MiniPlayer({ player, onOpen }: { player: PlayerState; onOpen: () => void }) {
  const insets = useSafeAreaInsets();
  const current = useMemo(() => programForNow(), []);
  return (
    <View style={[styles.miniPlayer, { bottom: 68 + Math.max(insets.bottom, 8) }]}>
      <Pressable onPress={onOpen} style={styles.miniInfo} accessibilityRole="button">
        <View style={styles.miniArt}><Text style={styles.miniArtText}>DFM</Text></View>
        <View style={styles.flex}>
          <View style={styles.miniLiveRow}><View style={styles.miniLiveDot} /><Text style={styles.miniLiveText}>LIVE RADIO</Text></View>
          <Text style={styles.miniTitle} numberOfLines={1}>{current.title}</Text>
        </View>
      </Pressable>
      <Pressable onPress={player.toggle} accessibilityLabel={player.isPlaying ? 'Pause' : 'Play'} style={styles.miniPlay}>
        <Text style={styles.miniPlayText}>{player.isPlaying ? 'Ⅱ' : '▶'}</Text>
      </Pressable>
    </View>
  );
}

function TabBar({ active, onTab }: { active: Tab; onTab: (tab: Tab) => void }) {
  const insets = useSafeAreaInsets();
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'live', label: 'Live', icon: '◉' },
    { id: 'schedule', label: 'Schedule', icon: '▦' },
    { id: 'more', label: 'Connect', icon: '＋' },
  ];
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => (
        <Pressable key={tab.id} onPress={() => onTab(tab.id)} accessibilityRole="tab" accessibilityState={{ selected: active === tab.id }} style={styles.tabItem}>
          <Text style={[styles.tabIcon, active === tab.id && styles.tabActive]}>{tab.icon}</Text>
          <Text style={[styles.tabLabel, active === tab.id && styles.tabActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function StoryModal({ story, onClose }: { story: Story | null; onClose: () => void }) {
  return (
    <Modal visible={Boolean(story)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <Logo compact />
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close story"><Text style={styles.closeText}>×</Text></Pressable>
        </View>
        {story && (
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={[styles.modalArt, { backgroundColor: story.accent }]}>
              <Text style={styles.modalArtText}>DFM</Text><View style={styles.modalArtCircle} />
            </View>
            <Text style={[styles.storyKicker, { color: story.accent }]}>{story.kicker}</Text>
            <Text style={styles.modalTitle}>{story.title}</Text>
            <Text style={styles.modalMeta}>{story.published}  ·  DFM RTV International</Text>
            <Text style={styles.modalBody}>{story.summary}</Text>
            <Text style={styles.modalBody}>This prototype is ready to render full articles from the DFM website or CMS. Connect the content adapter in src/services to replace this seeded story with the published article body, imagery and sharing metadata.</Text>
            <Pressable onPress={() => openUrl(station.websiteUrl)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>READ ON DFM.NU</Text><Text style={styles.primaryButtonArrow}>↗</Text></Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function AppShell() {
  const [tab, setTab] = useState<Tab>('home');
  const [story, setStory] = useState<Story | null>(null);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | null>(null);
  const [streamError, setStreamError] = useState(false);
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hasLiveStream) return;
    let cancelled = false;

    resolveStreamUrl(station.streamUrl)
      .then((url) => {
        if (cancelled) return;
        player.replace(url);
        setResolvedStreamUrl(url);
        setStreamError(false);
      })
      .catch(() => {
        if (!cancelled) setStreamError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [player]);

  const toggle = () => {
    if (!hasLiveStream) {
      Alert.alert(
        'Live stream needs connecting',
        'Add DFM’s direct HTTPS MP3/AAC stream as EXPO_PUBLIC_DFM_STREAM_URL. You can still open the station website now.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Open dfm.nu', onPress: () => openUrl(station.websiteUrl) }],
      );
      return;
    }
    if (!resolvedStreamUrl) {
      Alert.alert(
        streamError ? 'Stream unavailable' : 'Preparing the live stream',
        streamError
          ? 'The DFM playlist could not be loaded. Check your connection or visit dfm.nu.'
          : 'The DFM playlist is still loading. Please try again in a moment.',
        streamError
          ? [{ text: 'Close', style: 'cancel' }, { text: 'Open dfm.nu', onPress: () => openUrl(station.websiteUrl) }]
          : [{ text: 'OK' }],
      );
      return;
    }
    try {
      status.playing ? player.pause() : player.play();
    } catch {
      Alert.alert('Stream unavailable', 'The live stream could not be started. Check your connection and try again.');
    }
  };

  const playerState = { isPlaying: Boolean(status.playing), toggle };
  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.screen}>
          {tab === 'home' && <HomeScreen player={playerState} onTab={setTab} onStory={setStory} />}
          {tab === 'live' && <LiveScreen player={playerState} />}
          {tab === 'schedule' && <ScheduleScreen />}
          {tab === 'more' && <MoreScreen />}
        </View>
      </SafeAreaView>
      <MiniPlayer player={playerState} onOpen={() => setTab('live')} />
      <TabBar active={tab} onTab={setTab} />
      <StoryModal story={story} onClose={() => setStory(null)} />
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><AppShell /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.ink },
  safeArea: { flex: 1, backgroundColor: colors.ink },
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: space.md, paddingTop: 10 },
  flex: { flex: 1 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, minHeight: 48 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { paddingTop: 1 },
  logoMarkCompact: { transform: [{ scale: 0.84 }] },
  logoText: { color: colors.white, fontSize: 27, lineHeight: 27, fontWeight: '900', letterSpacing: -1.8, fontStyle: 'italic' },
  logoTextCompact: { fontSize: 22, lineHeight: 23 },
  logoStripe: { height: 4, width: '95%', marginTop: 2, backgroundColor: colors.yellow, transform: [{ skewX: '-20deg' }] },
  logoRtv: { color: colors.coral, fontWeight: '900', fontSize: 13, lineHeight: 13, letterSpacing: 3 },
  logoInternational: { color: colors.muted, fontWeight: '700', fontSize: 6.5, letterSpacing: 1.25, marginTop: 2 },
  pageTitle: { color: colors.white, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  webButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radii.pill },
  webButtonText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  arrow: { color: colors.yellow, fontSize: 15 },
  hero: { minHeight: 306, borderRadius: radii.large, padding: 22, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(70,215,200,0.13)', top: -90, right: -50 },
  livePill: { position: 'absolute', top: 18, left: 18, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: 'rgba(5,12,22,0.62)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.pill },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral },
  livePillText: { color: colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  heroEyebrow: { color: colors.aqua, fontSize: 11, fontWeight: '800', letterSpacing: 1.7, marginBottom: 8 },
  heroTitle: { color: colors.white, fontSize: 31, lineHeight: 34, fontWeight: '800', letterSpacing: -0.9 },
  heroMeta: { color: colors.muted, fontSize: 13, marginTop: 7 },
  heroPlayerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, gap: 19 },
  playButton: { backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', shadowColor: colors.yellow, shadowOpacity: 0.23, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  playTriangle: { width: 0, height: 0, borderTopWidth: 9, borderBottomWidth: 9, borderLeftWidth: 15, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: colors.ink, marginLeft: 4 },
  pauseIcon: { flexDirection: 'row', gap: 5 },
  pauseBar: { width: 5, height: 19, borderRadius: 2, backgroundColor: colors.ink },
  equalizer: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 5, overflow: 'hidden' },
  equalizerBar: { width: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.34)' },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 30 },
  quickCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: colors.card, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.line },
  quickIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  quickIconText: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  quickLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  quickTitle: { color: colors.white, fontSize: 13, fontWeight: '700', marginTop: 2 },
  quickArrow: { color: colors.muted, fontSize: 24 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: colors.white, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  sectionAction: { color: colors.yellow, fontSize: 12, fontWeight: '700' },
  storyList: { gap: 12, paddingRight: 18, marginBottom: 30 },
  storyCard: { width: 238, backgroundColor: colors.card, borderRadius: radii.medium, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  storyArt: { height: 128, padding: 14, alignItems: 'flex-start', justifyContent: 'flex-end', overflow: 'hidden' },
  storyNumber: { position: 'absolute', right: 8, top: -14, color: 'rgba(7,17,31,0.25)', fontSize: 90, fontWeight: '900', letterSpacing: -8 },
  storyArtCircle: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 22, borderColor: 'rgba(255,255,255,0.16)', left: -35, top: -32 },
  storyCopy: { padding: 15, minHeight: 146 },
  storyKicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 7 },
  storyTitle: { color: colors.white, fontSize: 17, lineHeight: 21, fontWeight: '700' },
  storyPublished: { color: colors.muted, fontSize: 11, marginTop: 12 },
  schedulePreview: { backgroundColor: colors.card, borderRadius: radii.medium, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line },
  programRow: { flexDirection: 'row', minHeight: 98, paddingVertical: 15 },
  programBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  programTime: { width: 52 },
  programStart: { color: colors.white, fontSize: 14, fontWeight: '800' },
  programEnd: { color: colors.muted, fontSize: 10, marginTop: 4 },
  programLine: { width: 22, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(70,215,200,0.25)' },
  programDot: { position: 'absolute', left: -3.5, top: 3, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.aqua },
  programCopy: { flex: 1 },
  programTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  programHost: { color: colors.muted, fontSize: 11, marginTop: 3 },
  categoryPill: { alignSelf: 'flex-start', borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 8, paddingVertical: 4, marginTop: 8 },
  categoryText: { color: colors.blue, fontSize: 8, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  homeBottomSpace: { height: 165 },
  liveStage: { minHeight: 468, alignItems: 'center', padding: 26, borderRadius: radii.large, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  signalRing: { position: 'absolute', top: 25, width: 260, height: 260, borderRadius: 130, borderWidth: 2, borderColor: colors.aqua },
  discOuter: { width: 216, height: 216, borderRadius: 108, backgroundColor: '#09131F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  discInner: { width: 98, height: 98, borderRadius: 49, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  onAir: { color: colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 2.1, marginTop: 20 },
  liveTitle: { color: colors.white, fontSize: 25, fontWeight: '800', letterSpacing: -0.5, marginTop: 6 },
  liveHost: { color: colors.muted, fontSize: 12, marginTop: 5, marginBottom: 18 },
  streamHint: { color: colors.muted, fontSize: 10, marginTop: 12 },
  nowCard: { flexDirection: 'row', backgroundColor: colors.card, marginTop: 12, padding: 17, borderRadius: radii.medium, gap: 15, borderWidth: 1, borderColor: colors.line },
  nowDivider: { width: 1, backgroundColor: colors.line },
  nowLabel: { color: colors.aqua, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  nowTitle: { color: colors.white, fontSize: 13, fontWeight: '700', marginTop: 5 },
  nowMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  primaryButton: { minHeight: 52, borderRadius: radii.pill, backgroundColor: colors.yellow, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { color: colors.ink, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  primaryButtonArrow: { color: colors.ink, fontSize: 21, fontWeight: '700' },
  pageIntro: { color: colors.muted, fontSize: 14, lineHeight: 20, maxWidth: 290, marginTop: -10, marginBottom: 20 },
  daysRow: { gap: 7, paddingRight: 20, marginBottom: 24 },
  dayButton: { width: 52, height: 60, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  dayButtonActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  dayText: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  dayTextActive: { color: colors.ink },
  dayIndicator: { position: 'absolute', bottom: 7, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.ink },
  scheduleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scheduleDayTitle: { color: colors.white, fontSize: 21, fontWeight: '800' },
  scheduleTimezone: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  scheduleCard: { backgroundColor: colors.card, borderRadius: radii.medium, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  seedNote: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 12, paddingHorizontal: 4 },
  connectHero: { borderRadius: radii.large, padding: 23, minHeight: 218, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  connectTitle: { color: colors.white, fontSize: 27, lineHeight: 30, fontWeight: '800', letterSpacing: -0.7, maxWidth: 280, marginTop: 30 },
  connectCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 9, maxWidth: 310 },
  groupLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 25, marginBottom: 10, marginLeft: 3 },
  linksCard: { backgroundColor: colors.card, borderRadius: radii.medium, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  linkRow: { minHeight: 72, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  linkDisabled: { opacity: 0.48 },
  linkIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkIconText: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  linkTitle: { color: colors.white, fontSize: 14, fontWeight: '700' },
  linkSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  linkChevron: { color: colors.muted, fontSize: 25 },
  aboutCard: { backgroundColor: colors.card, borderRadius: radii.medium, padding: 18, borderWidth: 1, borderColor: colors.line },
  aboutTitle: { color: colors.white, fontSize: 17, fontWeight: '800' },
  aboutCopy: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 9 },
  versionRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginTop: 18, paddingTop: 15 },
  versionLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  version: { color: colors.white, fontSize: 10, fontWeight: '700' },
  miniPlayer: { position: 'absolute', left: 10, right: 10, height: 68, backgroundColor: '#1A2B40', borderRadius: 19, flexDirection: 'row', alignItems: 'center', padding: 8, paddingLeft: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', shadowColor: colors.black, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 13, zIndex: 10 },
  miniInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniArt: { width: 48, height: 48, borderRadius: 13, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-2deg' }] },
  miniArtText: { color: colors.white, fontSize: 14, fontWeight: '900', fontStyle: 'italic' },
  miniLiveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.coral },
  miniLiveText: { color: colors.aqua, fontSize: 7.5, fontWeight: '900', letterSpacing: 1.1 },
  miniTitle: { color: colors.white, fontSize: 13, fontWeight: '700', marginTop: 3 },
  miniPlay: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  miniPlayText: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  tabBar: { minHeight: 74, backgroundColor: colors.inkLifted, flexDirection: 'row', alignItems: 'flex-start', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabIcon: { color: colors.muted, fontSize: 19, lineHeight: 21, fontWeight: '700' },
  tabLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  tabActive: { color: colors.yellow },
  modal: { flex: 1, backgroundColor: colors.ink },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.white, fontSize: 25, lineHeight: 28 },
  modalContent: { padding: 17, paddingBottom: 45 },
  modalArt: { height: 230, borderRadius: radii.large, justifyContent: 'flex-end', padding: 22, overflow: 'hidden', marginBottom: 24 },
  modalArtText: { color: colors.white, fontSize: 55, fontWeight: '900', letterSpacing: -4, fontStyle: 'italic' },
  modalArtCircle: { position: 'absolute', width: 230, height: 230, borderRadius: 115, borderWidth: 38, borderColor: 'rgba(255,255,255,0.15)', right: -50, top: -70 },
  modalTitle: { color: colors.white, fontSize: 31, lineHeight: 36, fontWeight: '800', letterSpacing: -0.9 },
  modalMeta: { color: colors.muted, fontSize: 11, marginTop: 13, marginBottom: 25 },
  modalBody: { color: '#C7D1DC', fontSize: 15, lineHeight: 24, marginBottom: 19 },
});
