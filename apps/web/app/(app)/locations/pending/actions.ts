'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const categorySchema = z.enum(['office', 'client_site', 'warehouse', 'checkpoint', 'other'])

const ApproveLocationSchema = z.object({
  locationId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  category: categorySchema,
})

const RejectLocationSchema = z.object({
  locationId: z.string().uuid(),
  reason: z.string().trim().min(2).max(500),
})

export async function approveLocation(formData: FormData) {
  const parsed = ApproveLocationSchema.safeParse({
    locationId: formData.get('locationId'),
    name: formData.get('name'),
    category: formData.get('category'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'არასწორი მონაცემები' }
  }

  const supabase = await createClient()
  const { error: categoryError } = await supabase
    .from('locations')
    .update({ category: parsed.data.category })
    .eq('id', parsed.data.locationId)
    .eq('status', 'pending_approval')

  if (categoryError) return { error: categoryError.message }

  const { error } = await supabase.rpc('approve_location', {
    p_id: parsed.data.locationId,
    p_name: parsed.data.name,
  })

  if (error) return { error: error.message }
  revalidateLocationPaths()
  return { success: true }
}

export async function rejectLocation(formData: FormData) {
  const parsed = RejectLocationSchema.safeParse({
    locationId: formData.get('locationId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'უარყოფის მიზეზი აუცილებელია' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('reject_location', {
    p_id: parsed.data.locationId,
    p_reason: parsed.data.reason,
  })

  if (error) return { error: error.message }
  revalidateLocationPaths()
  return { success: true }
}

function revalidateLocationPaths() {
  revalidatePath('/', 'layout')
  revalidatePath('/locations')
  revalidatePath('/locations/pending')
}
