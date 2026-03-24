import { redirect } from 'next/navigation';

// Public members list redirects to the directory for now
export default function MembersIndexPage() {
  redirect('/directory');
}
