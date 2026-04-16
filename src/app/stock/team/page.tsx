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

  const [goalsRes, todosRes, membersRes, sponsorsRes] = await Promise.allSettled([
    supabase.from('stock_goals').select('*').order('sort_order'),
    supabase
      .from('stock_todos')
      .select('*, owner:stock_team_members!owner_id(id, name), creator:stock_team_members!created_by(id, name)')
      .order('status')
      .order('created_at', { ascending: false }),
    supabase.from('stock_team_members').select('id, name, role, scope').order('created_at'),
    supabase
      .from('stock_sponsors')
      .select('*, owner:stock_team_members!owner_id(id, name)')
      .order('track')
      .order('status')
      .order('created_at', { ascending: false }),
  ]);

  const goals = goalsRes.status === 'fulfilled' ? goalsRes.value.data || [] : [];
  const todos = todosRes.status === 'fulfilled' ? todosRes.value.data || [] : [];
  const members = membersRes.status === 'fulfilled' ? membersRes.value.data || [] : [];
  const sponsors = sponsorsRes.status === 'fulfilled' ? sponsorsRes.value.data || [] : [];

  return (
    <Dashboard
      memberName={member.memberName}
      memberId={member.memberId}
      goals={goals}
      todos={todos}
      members={members}
      sponsors={sponsors}
    />
  );
}
