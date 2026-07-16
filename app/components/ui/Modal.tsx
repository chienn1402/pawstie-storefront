import {type ReactNode, useEffect, useId, useRef} from 'react';
import {CloseIcon} from '~/components/icons';
import {cn} from '~/lib/utils';

// Exclude hidden inputs: they can never become document.activeElement, so a
// trailing hidden input would break the forward Tab-wrap. Mirrors Aside.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A prop-controlled slide-in dialog with an overlay, matching the cart drawer's
 * look and accessibility behaviour (focus trap, Escape to close, body-scroll
 * lock, focus restore). Unlike {@link Aside} it isn't tied to the global aside
 * context, so callers own the open/close state locally.
 */
export function Modal({
  open,
  onClose,
  heading,
  children,
}: {
  open: boolean;
  onClose: () => void;
  heading: ReactNode;
  children?: ReactNode;
}) {
  const id = useId();
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  // Keep the latest onClose without re-running the effect (and thus re-locking
  // scroll / re-focusing) every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const close = () => onCloseRef.current();
    const abortController = new AbortController();
    const panel = panelRef.current;

    // Remember what was focused so we can restore it on close.
    triggerRef.current = document.activeElement as HTMLElement | null;

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

        // Focus escaped the panel — trap it back inside.
        if (active && !panel.contains(active)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
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
      // Focus the trigger if it's still in the document.
      if (triggerRef.current?.isConnected) {
        triggerRef.current.focus();
      }
      triggerRef.current = null;
    };
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300 ease-out',
        open ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none',
      )}
    >
      {/* Click-outside target. Sits under the panel in paint order. */}
      <button
        aria-label="Close"
        className="absolute inset-0 size-full cursor-default"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <aside
        aria-labelledby={id}
        aria-modal="true"
        className={cn(
          'absolute right-0 top-0 flex h-dvh w-full flex-col overflow-hidden bg-white shadow-[0_0_60px_rgba(0,0,0,0.25)] outline-none',
          'transition-transform duration-300 ease-out motion-reduce:transition-none',
          'sm:w-[32rem] sm:rounded-l-[1.75rem]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="flex flex-none items-start justify-between px-5 pb-3 pt-5 sm:px-8 sm:pt-8">
          <h3
            className="m-0 font-heading text-xl font-extrabold tracking-[-0.02em] text-[#004817]"
            id={id}
          >
            {heading}
          </h3>
          <button
            aria-label="Close"
            className="grid size-9 flex-none place-items-center rounded-full bg-[#eef3ee] text-[#004817] transition-colors hover:bg-[#dfe9e0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00521d]"
            onClick={onClose}
            type="button"
          >
            <CloseIcon className="size-4" />
          </button>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6 sm:px-8 sm:pb-8">
          {children}
        </main>
      </aside>
    </div>
  );
}
