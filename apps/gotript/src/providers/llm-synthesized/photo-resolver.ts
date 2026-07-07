import type { PhotoCategory } from './llm-stay';
import { pickPhotoId } from '../_shared/photo-pool';

/**
 * Resolve a per-stay photo id.
 *
 * Slice E1: was one photo per category (every cityscape result shared
 * the same Unsplash url). Now: hash the stay slug into a 5+ photo
 * pool per category. Same slug → same photo (idempotent); different
 * stays in a batch get distributed across the pool, so a four-up
 * Tokyo grid no longer shows the same image four times.
 *
 * `slug` is optional for back-compat; when omitted we still resolve a
 * stable per-category default (the pool's first entry). Real callers
 * always pass it.
 */
export function resolvePhotoId(category: PhotoCategory, slug = '__default__'): string {
  return pickPhotoId(category, slug);
}
