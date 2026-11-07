import { useEffect } from 'react';
import { BRANDING } from '../config/branding';

// Sets the browser tab title (and the share/bookmark title) for the current page.
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${BRANDING.name}` : BRANDING.name;
    return () => { document.title = previous; };
  }, [title]);
}
