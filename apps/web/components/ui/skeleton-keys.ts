// Stable string keys for static decorative skeleton arrays — sidesteps the
// lint complaint about array index keys without giving up React's reconciler
// guarantees (these arrays never reorder).
export const SKELETON_KEYS_3 = ['a', 'b', 'c'] as const
export const SKELETON_KEYS_4 = ['a', 'b', 'c', 'd'] as const
export const SKELETON_KEYS_5 = ['a', 'b', 'c', 'd', 'e'] as const
export const SKELETON_KEYS_6 = ['a', 'b', 'c', 'd', 'e', 'f'] as const
export const SKELETON_KEYS_8 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
