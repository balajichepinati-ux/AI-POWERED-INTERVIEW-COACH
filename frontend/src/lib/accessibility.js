/**
 * Keyboard Shortcuts & Accessibility Utilities
 */

/**
 * Keyboard shortcut hook for React
 */
export function useKeyboardShortcuts(shortcuts) {
  React.useEffect(() => {
    function handleKeyDown(e) {
      for (const { key, ctrlKey = false, shiftKey = false, altKey = false, callback } of shortcuts) {
        if (
          e.key.toLowerCase() === key.toLowerCase() &&
          e.ctrlKey === ctrlKey &&
          e.shiftKey === shiftKey &&
          e.altKey === altKey
        ) {
          e.preventDefault()
          callback()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Common keyboard shortcuts
 */
export const SHORTCUTS = {
  SUBMIT: { key: 'Enter', ctrlKey: true, label: 'Ctrl+Enter' },
  ESCAPE: { key: 'Escape', ctrlKey: false, label: 'Esc' },
  HELP: { key: '?', ctrlKey: false, label: '?' },
  NEXT: { key: 'ArrowRight', ctrlKey: false, label: 'Right Arrow' },
  PREV: { key: 'ArrowLeft', ctrlKey: false, label: 'Left Arrow' },
  FOCUS_SEARCH: { key: '/', ctrlKey: false, label: '/' }
}

/**
 * Generate accessible label from field name
 */
export function getAccessibleLabel(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

/**
 * ARIA attributes helper
 */
export const ariaAttrs = {
  button: (label, pressed = null) => ({
    role: 'button',
    'aria-label': label,
    ...(pressed !== null && { 'aria-pressed': pressed })
  }),

  combobox: (expanded, hasPopup = true) => ({
    role: 'combobox',
    'aria-expanded': expanded,
    'aria-haspopup': hasPopup
  }),

  listbox: () => ({
    role: 'listbox'
  }),

  option: (selected) => ({
    role: 'option',
    'aria-selected': selected
  }),

  alert: (live = 'polite') => ({
    role: 'alert',
    'aria-live': live,
    'aria-atomic': 'true'
  }),

  tab: (selected, panelId) => ({
    role: 'tab',
    'aria-selected': selected,
    'aria-controls': panelId
  }),

  tabpanel: (id, tabId) => ({
    role: 'tabpanel',
    id,
    'aria-labelledby': tabId
  }),

  loading: () => ({
    'aria-busy': 'true',
    'aria-label': 'Loading'
  })
}

/**
 * Skip link for keyboard navigation
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="absolute -top-12 left-0 bg-brand-600 px-4 py-2 text-white rounded-b focus:top-0 z-50 transition-all"
    >
      Skip to main content
    </a>
  )
}

/**
 * Focus management helper
 */
export function useFocusManagement(containerRef, initialFocusRef) {
  React.useEffect(() => {
    // Focus initial element when mounted
    initialFocusRef?.current?.focus()

    // Trap focus within container (for modals)
    function handleKeyDown(e) {
      if (e.key !== 'Tab' || !containerRef.current) return

      const focusable = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusable.length === 0) return

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]
      const activeElement = document.activeElement

      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    containerRef.current?.addEventListener('keydown', handleKeyDown)
    return () => containerRef.current?.removeEventListener('keydown', handleKeyDown)
  }, [containerRef, initialFocusRef])
}

/**
 * Announce updates to screen readers
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = React.useState('')

  const announce = (message) => {
    setAnnouncement(message)
    // Clear after announcement
    setTimeout(() => setAnnouncement(''), 1000)
  }

  return {
    announcement,
    announce,
    AnnouncementRegion: () => (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    )
  }
}
