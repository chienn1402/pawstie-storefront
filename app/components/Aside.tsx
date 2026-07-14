import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {CloseIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

// Exclude hidden inputs: Hydrogen's CartForm injects them, and if one ends up
// last in DOM order, it breaks the forward Tab-wrap since hidden inputs can
// never become document.activeElement.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A slide-in drawer with an overlay. Shared by the cart and the mobile menu.
 * @example
 * ```jsx
 * <Aside type="cart" heading="Your cart">…</Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const id = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded) return;

    const abortController = new AbortController();
    const panel = panelRef.current;

    // Lock the page behind the drawer. This replaces the deleted
    // `html:has(.overlay.expanded) { overflow: hidden }` rule — which only
    // locked below 45em. Locking at every width is the behaviour we want.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panel?.focus();

    document.addEventListener(
      'keydown',
      function handler(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          close();
          return;
        }
        if (event.key !== 'Tab' || !panel) return;

        // Trap Tab inside the panel. Recomputed per keypress because the cart's
        // contents change as lines are added and removed.
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE),
        );
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        // Guard: if focus is outside the panel (e.g., from an unmounted button),
        // trap it back inside to prevent Tab from escaping the drawer.
        if (active && !panel.contains(active)) {
          event.preventDefault();
          if (event.shiftKey) {
            last.focus();
          } else {
            first.focus();
          }
          return;
        }

        if (event.shiftKey && (active === first || active === panel)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      },
      {signal: abortController.signal},
    );

    return () => {
      abortController.abort();
      document.body.style.overflow = previousOverflow;
    };
  }, [close, expanded]);

  return (
    <div
      aria-hidden={!expanded}
      className={cn(
        'fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300 ease-out',
        expanded
          ? 'visible opacity-100'
          : 'invisible opacity-0 pointer-events-none',
      )}
    >
      {/* Click-outside target. Sits under the panel in paint order, so clicks on
          the panel itself never reach it. tabIndex -1 keeps it out of the trap. */}
      <button
        aria-label="Close"
        className="absolute inset-0 size-full cursor-default"
        onClick={close}
        tabIndex={-1}
        type="button"
      />
      <aside
        aria-labelledby={id}
        aria-modal="true"
        className={cn(
          'absolute right-0 top-0 flex h-dvh w-full flex-col overflow-hidden bg-white shadow-[0_0_60px_rgba(0,0,0,0.25)] outline-none',
          'transition-transform duration-300 ease-out motion-reduce:transition-none',
          'sm:w-[28rem] sm:rounded-l-[1.75rem]',
          expanded ? 'translate-x-0' : 'translate-x-full',
        )}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="flex flex-none items-start justify-between px-5 pb-3 pt-5">
          <h3
            className="m-0 font-heading text-lg font-extrabold tracking-[-0.02em] text-[#004817]"
            id={id}
          >
            {heading}
          </h3>
          <button
            aria-label="Close"
            className="grid size-9 flex-none place-items-center rounded-full bg-[#eef3ee] text-[#004817] transition-colors hover:bg-[#dfe9e0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
            onClick={close}
            type="button"
          >
            <CloseIcon className="size-4" />
          </button>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((mode: AsideType) => {
    if (mode !== 'closed') {
      triggerRef.current = document.activeElement as HTMLElement | null;
    }
    setType(mode);
  }, []);

  const close = useCallback(() => {
    setType('closed');
    // The trigger can vanish while the drawer is open — removing the last cart
    // line unmounts CartFab, which is what opened it. Focusing a detached node
    // silently drops focus to <body>, so check before restoring.
    if (triggerRef.current?.isConnected) {
      triggerRef.current.focus();
    }
    triggerRef.current = null;
  }, []);

  return (
    <AsideContext.Provider value={{type, open, close}}>
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
