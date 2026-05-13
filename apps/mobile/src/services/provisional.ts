import { supabase } from './supabase'

interface SubmitProvisionalArgs {
  tenantId: string
  userId: string
  latitude: number
  longitude: number
  /** Raw base64 jpeg payload (no `data:image/jpeg;base64,` prefix). */
  photoBase64: string
  /** Free-form note from the employee. Becomes `locations.name` if provided. */
  note: string | null
}

function base64ToBytes(base64: string): Uint8Array {
  // atob is globally available in modern React Native (Hermes).
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function submitProvisionalLocation({
  tenantId,
  userId,
  latitude,
  longitude,
  photoBase64,
  note,
}: SubmitProvisionalArgs): Promise<void> {
  // 1) Upload photo to the private bucket. Path is scoped to the user id so
  //    member-read policy + service-side admin reads stay easy to reason about.
  const photoPath = `${userId}/${Date.now()}.jpg`
  const bytes = base64ToBytes(photoBase64)

  const { error: uploadError } = await supabase.storage
    .from('provisional-photos')
    .upload(photoPath, bytes, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) {
    throw new Error(`Photo upload failed: ${uploadError.message}`)
  }

  // 2) Insert the row. RLS `locations_member_submit` requires
  //    status = 'pending_approval' AND active membership in the tenant.
  const wkt = `SRID=4326;POINT(${longitude} ${latitude})`
  const { error: insertError } = await supabase.from('locations').insert({
    tenant_id: tenantId,
    name: note?.trim() || null,
    category: 'other',
    // PostGIS geography accepts WKT via PostgREST; supabase-js types this as
    // `unknown`, so cast at the boundary.
    center: wkt as unknown as never,
    radius_m: 100,
    trigger_radius_m: 50,
    boundary_radius_m: 100,
    status: 'pending_approval',
    photo_url: photoPath,
    submitted_at: new Date().toISOString(),
    created_by_user_id: userId,
  })

  if (insertError) {
    // Best-effort rollback of the orphan photo so storage doesn't fill up
    // with rows that never made it into the DB.
    await supabase.storage.from('provisional-photos').remove([photoPath])
    throw new Error(`Submit failed: ${insertError.message}`)
  }
}
