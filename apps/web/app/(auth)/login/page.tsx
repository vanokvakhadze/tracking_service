import { LoginForm } from '@/components/auth/LoginForm'

interface LoginPageProps {
  searchParams?: Promise<{ deleted?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {}
  return <LoginForm deleted={params.deleted === '1'} />
}
