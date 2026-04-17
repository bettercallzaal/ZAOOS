import { Metadata } from 'next';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { LoginForm } from './LoginForm';
import { Dashboard } from './Dashboard';

export const metadata: Metadata = {
  title: 'ZAOstock Team Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StockTeamPage() {
  const member = await getStockTeamMember();

  if (!member) {
    return <LoginForm />;
  }

  const supabase = getSupabaseAdmin();

  const [
    goalsRes,
    todosRes,
    membersRes,
    sponsorsRes,
    artistsRes,
    timelineRes,
    volunteersRes,
    budgetRes,
    notesRes,
  ] = await Promise.allSettled([
    supabase.from('stock_goals').select('*').order('sort_order'),
    supabase
      .from('stock_todos')
      .select('*, owner:stock_team_members!owner_id(id, name), creator:stock_team_members!created_by(id, name)')
      .order('status')
      .order('created_at', { ascending: false }),
    supabase.from('stock_team_members').select('id, name, role, scope, bio, links, photo_url').order('created_at'),
    supabase
      .from('stock_sponsors')
      .select('*, owner:stock_team_members!owner_id(id, name)')
      .order('track')
      .order('status')
      .order('created_at', { ascending: false }),
    supabase
      .from('stock_artists')
      .select('*, outreach:stock_team_members!outreach_by(id, name)')
      .order('status')
      .order('set_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('stock_timeline')
      .select('*, owner:stock_team_members!owner_id(id, name)')
      .order('due_date', { ascending: true }),
    supabase
      .from('stock_volunteers')
      .select('*, recruited_by_member:stock_team_members!recruited_by(id, name)')
      .order('confirmed', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('stock_budget_entries')
      .select('*, related_sponsor:stock_sponsors!related_sponsor_id(id, name)')
      .order('type')
      .order('category')
      .order('created_at', { ascending: false }),
    supabase
      .from('stock_meeting_notes')
      .select('*, creator:stock_team_members!created_by(id, name)')
      .order('meeting_date', { ascending: false }),
  ]);

  const goals = goalsRes.status === 'fulfilled' ? goalsRes.value.data || [] : [];
  const todos = todosRes.status === 'fulfilled' ? todosRes.value.data || [] : [];
  const members = membersRes.status === 'fulfilled' ? membersRes.value.data || [] : [];
  const sponsors = sponsorsRes.status === 'fulfilled' ? sponsorsRes.value.data || [] : [];
  const artists = artistsRes.status === 'fulfilled' ? artistsRes.value.data || [] : [];
  const milestones = timelineRes.status === 'fulfilled' ? timelineRes.value.data || [] : [];
  const volunteers = volunteersRes.status === 'fulfilled' ? volunteersRes.value.data || [] : [];
  const budget = budgetRes.status === 'fulfilled' ? budgetRes.value.data || [] : [];
  const meetingNotes = notesRes.status === 'fulfilled' ? notesRes.value.data || [] : [];

  return (
    <Dashboard
      memberName={member.memberName}
      memberId={member.memberId}
      goals={goals}
      todos={todos}
      members={members}
      sponsors={sponsors}
      artists={artists}
      milestones={milestones}
      volunteers={volunteers}
      budget={budget}
      meetingNotes={meetingNotes}
    />
  );
}
