import type { MuscleGroup } from '@/lib/types'

/** Compact anatomy badge overlaid on exercise thumbs. */
export function MuscleMap({ muscle }: { muscle: MuscleGroup }) {
  const back = muscle === 'back'
  const on = (hit: MuscleGroup[]) =>
    muscle === 'full_body' || muscle === 'cardio' || hit.includes(muscle)

  return (
    <svg className="muscle-map" viewBox="0 0 32 40" aria-hidden>
      <circle className="mm-body" cx="16" cy="4.2" r="3.1" />
      {back ? (
        <>
          <path className="mm-body" d="M10.4 8.2 C10.4 8.2 8.2 10.4 8.6 14.8 L9.4 22.4 C10 25.2 12.4 26.6 16 26.6 C19.6 26.6 22 25.2 22.6 22.4 L23.4 14.8 C23.8 10.4 21.6 8.2 21.6 8.2 Z" />
          <path className={on(['back']) ? 'mm-on' : 'mm-off'} d="M11.2 11.4 C11.6 16.8 13.2 20.8 16 21.4 C18.8 20.8 20.4 16.8 20.8 11.4 C19.2 12.8 16 13.2 16 13.2 C16 13.2 12.8 12.8 11.2 11.4 Z" />
          <path className={on(['shoulders']) ? 'mm-on' : 'mm-off'} d="M8.8 9.2 C7.2 10.6 6.8 13.2 7.4 15.4 L9.8 14.2 C9.6 11.8 10.2 9.8 11.4 8.8 Z" />
          <path className={on(['shoulders']) ? 'mm-on' : 'mm-off'} d="M23.2 9.2 C24.8 10.6 25.2 13.2 24.6 15.4 L22.2 14.2 C22.4 11.8 21.8 9.8 20.6 8.8 Z" />
        </>
      ) : (
        <>
          <path className="mm-body" d="M10.4 8.2 C10.4 8.2 8.2 10.4 8.6 14.8 L9.4 22.4 C10 25.2 12.4 26.6 16 26.6 C19.6 26.6 22 25.2 22.6 22.4 L23.4 14.8 C23.8 10.4 21.6 8.2 21.6 8.2 Z" />
          <path className={on(['chest', 'shoulders']) ? 'mm-on' : 'mm-off'} d="M10.8 10.2 C11.4 13.4 13.2 15.2 16 15.4 C18.8 15.2 20.6 13.4 21.2 10.2 C19.4 9.4 16.8 9 16 9 C15.2 9 12.6 9.4 10.8 10.2 Z" />
          <path className={on(['core']) ? 'mm-on' : 'mm-off'} d="M12.6 16.2 H19.4 L19 22.2 C18.4 23.6 17.2 24.4 16 24.4 C14.8 24.4 13.6 23.6 13 22.2 Z" />
          <path className={on(['shoulders']) ? 'mm-on' : 'mm-off'} d="M8.8 9.2 C7.2 10.6 6.8 13.2 7.4 15.4 L9.8 14.2 C9.6 11.8 10.2 9.8 11.4 8.8 Z" />
          <path className={on(['shoulders']) ? 'mm-on' : 'mm-off'} d="M23.2 9.2 C24.8 10.6 25.2 13.2 24.6 15.4 L22.2 14.2 C22.4 11.8 21.8 9.8 20.6 8.8 Z" />
        </>
      )}
      <path className={on(['arms']) ? 'mm-on' : 'mm-off'} d="M8.2 14.8 L6.2 22.8 C5.9 24.2 6.8 25 7.8 24.6 L10 22.8 L9.4 16.2 Z" />
      <path className={on(['arms']) ? 'mm-on' : 'mm-off'} d="M23.8 14.8 L25.8 22.8 C26.1 24.2 25.2 25 24.2 24.6 L22 22.8 L22.6 16.2 Z" />
      <path className={on(['legs']) ? 'mm-on' : 'mm-off'} d="M10.4 26.2 L9.2 38.2 C9 39.2 9.8 39.6 10.8 39.2 L14.4 37.6 L15.2 26.4 C13.2 26.8 11.4 26.6 10.4 26.2 Z" />
      <path className={on(['legs']) ? 'mm-on' : 'mm-off'} d="M21.6 26.2 L22.8 38.2 C23 39.2 22.2 39.6 21.2 39.2 L17.6 37.6 L16.8 26.4 C18.8 26.8 20.6 26.6 21.6 26.2 Z" />
    </svg>
  )
}
