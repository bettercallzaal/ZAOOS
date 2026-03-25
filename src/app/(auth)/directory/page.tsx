import { redirect } from 'next/navigation';

// Directory now lives at /members (public, no auth required)
export default function DirectoryPage() {
  redirect('/members');
}
