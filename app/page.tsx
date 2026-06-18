import { getPublicContacts, getPublicProfile } from '@/lib/api/public'
import HomeClient from './HomeClient'

export default async function Home() {
  const [contacts, profile] = await Promise.all([
    getPublicContacts().catch(() => []),
    getPublicProfile().catch(() => null),
  ])

  return <HomeClient contacts={contacts} profile={profile} />
}
