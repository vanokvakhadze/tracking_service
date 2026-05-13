import { Feather } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchTeamRoster, type TeamRosterMember } from '@/src/services/team-roster'
import type { TeamStatus } from '@/src/services/team-positions'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  surface2: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
}

const STATUS_TONES: Record<TeamStatus, { bg: string; color: string; title: string }> = {
  active: { bg: '#F0FDF4', color: '#16A34A', title: 'აქტიური' },
  alert: { bg: '#FEF2F2', color: '#DC2626', title: 'ალერტი' },
  warning: { bg: '#FEFCE8', color: '#CA8A04', title: 'ყურადღება' },
  offline: { bg: '#F1F5F9', color: '#94A3B8', title: 'ოფლაინ' },
}

const SECTION_ORDER: TeamStatus[] = ['active', 'alert', 'warning', 'offline']

interface TeamSection {
  status: TeamStatus
  title: string
  data: TeamRosterMember[]
}

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamRosterMember[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    const rows = await fetchTeamRoster()
    setMembers(rows)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visibleMembers = useMemo(() => filterMembers(members, query), [members, query])
  const sections = useMemo(() => buildSections(visibleMembers), [visibleMembers])
  const activeCount = members.filter((member) => member.status === 'active').length

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SectionList
        sections={visibleMembers.length === 0 ? [] : sections}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => <TeamRow member={item} onPress={() => showMember(item)} />}
        renderSectionHeader={({ section }) => <SectionHeader section={section} />}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>გუნდი</Text>
              <Text style={styles.subtitle}>{activeCount} აქტიური</Text>
            </View>
            <View style={styles.searchBox}>
              <Feather name="search" size={17} color={KAYA.textTertiary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="სახელი ან ელფოსტა"
                placeholderTextColor={KAYA.textTertiary}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState loading={loading} hasQuery={query.trim().length > 0} />}
      />
    </SafeAreaView>
  )
}

function TeamRow({ member, onPress }: { member: TeamRosterMember; onPress: () => void }) {
  const tone = STATUS_TONES[member.status]
  const locationText =
    member.status === 'alert' && !member.current_location_name
      ? 'Mock GPS ამოცნობილია'
      : (member.current_location_name ?? 'ლოკაცია უცნობია')

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.avatarText, { color: tone.color }]}>{member.initials}</Text>
      </View>
      <View style={styles.memberBody}>
        <Text style={styles.memberName}>{member.name}</Text>
        <View style={styles.locationRow}>
          {member.status === 'alert' ? (
            <Feather name="alert-triangle" size={12} color={STATUS_TONES.alert.color} />
          ) : null}
          <Text
            style={[
              styles.location,
              member.status === 'alert' ? { color: STATUS_TONES.alert.color } : null,
            ]}
            numberOfLines={2}
          >
            {locationText}
          </Text>
        </View>
      </View>
      <View style={styles.rightRail}>
        <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.color }]}>
          <View style={[styles.badgeDot, { backgroundColor: tone.color }]} />
          <Text style={[styles.badgeText, { color: tone.color }]}>{tone.title}</Text>
        </View>
        <Text style={styles.duration}>{member.duration_label ?? '—'}</Text>
      </View>
    </TouchableOpacity>
  )
}

function SectionHeader({ section }: { section: TeamSection }) {
  const tone = STATUS_TONES[section.status]
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: tone.color }]} />
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  )
}

function EmptyState({ loading, hasQuery }: { loading: boolean; hasQuery: boolean }) {
  return (
    <View style={styles.empty}>
      <Feather name={loading ? 'loader' : 'users'} size={24} color={KAYA.textTertiary} />
      <Text style={styles.emptyTitle}>
        {loading ? 'იტვირთება…' : hasQuery ? 'შედეგი ვერ მოიძებნა' : 'თანამშრომლები ჯერ არ ჩანს'}
      </Text>
      {!loading ? (
        <Text style={styles.emptyText}>
          {hasQuery
            ? 'სცადე სხვა სახელი ან ელფოსტა.'
            : 'ადმინის გარდა აქტიური თანამშრომელი ამ tenant-ში არ არის.'}
        </Text>
      ) : null}
    </View>
  )
}

function filterMembers(members: TeamRosterMember[], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return members
  return members.filter((member) =>
    `${member.name} ${member.email}`.toLowerCase().includes(normalized),
  )
}

function buildSections(members: TeamRosterMember[]): TeamSection[] {
  return SECTION_ORDER.map((status) => ({
    status,
    title: STATUS_TONES[status].title.toUpperCase(),
    data: members.filter((member) => member.status === status),
  }))
}

function showMember(member: TeamRosterMember) {
  Alert.alert(
    member.name,
    [
      member.email,
      `${STATUS_TONES[member.status].title} · ${member.duration_label ?? 'დრო უცნობია'}`,
      member.current_location_name ?? 'ლოკაცია უცნობია',
    ].join('\n'),
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface },
  list: { padding: 16, paddingBottom: 28 },
  header: { gap: 14, marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 15, fontWeight: '600', color: KAYA.textSecondary },
  searchBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    backgroundColor: KAYA.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: KAYA.textPrimary, paddingVertical: 0 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionDot: { width: 7, height: 7, borderRadius: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: KAYA.textSecondary,
    letterSpacing: 0.5,
  },
  sectionCount: {
    minWidth: 22,
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: KAYA.surface2,
    color: KAYA.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: KAYA.border,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '700' },
  memberBody: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 20, fontWeight: '700', color: KAYA.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  location: { flex: 1, fontSize: 14, lineHeight: 19, color: KAYA.textSecondary },
  rightRail: { width: 108, alignItems: 'flex-end', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  duration: { fontSize: 15, fontWeight: '600', color: KAYA.textSecondary },
  empty: {
    marginTop: 36,
    backgroundColor: KAYA.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: KAYA.textPrimary },
  emptyText: { fontSize: 12, color: KAYA.textSecondary, textAlign: 'center', lineHeight: 18 },
})
