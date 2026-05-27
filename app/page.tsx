import { getPublicContacts } from '@/lib/api/public'
import HomeClient from './HomeClient'

export default async function Home() {
  const contacts = await getPublicContacts().catch(() => [])
  return <HomeClient contacts={contacts} />
}
