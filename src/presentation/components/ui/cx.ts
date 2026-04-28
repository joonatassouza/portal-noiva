/**
 * Tiny class-name joiner. Filters falsy values so you can write:
 *   cx('base', condition && 'extra', props.className)
 * Avoids pulling in `clsx` for one helper.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
