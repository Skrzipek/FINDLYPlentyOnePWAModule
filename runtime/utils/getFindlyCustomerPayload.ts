import type { User } from '@plentymarkets/shop-api';

export type FindlyCustomerPayload = {
  class: number;
  classId: number;
  id: number;
  sessionId: string;
  isLoggedIn: boolean;
};

const INVALID_SESSION_VALUES = new Set(['', 'null', 'undefined']);

function normalizeSessionId(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized = String(value).trim();

  return INVALID_SESSION_VALUES.has(normalized) ? '' : normalized;
}

function readPlentyShopCookieSessionId(): string {
  if (import.meta.server || typeof document === 'undefined') {
    return '';
  }

  const match = document.cookie.match(/(?:^|;\s*)plenty-shop-cookie=([^;]+)/);
  if (!match?.[1]) {
    return '';
  }

  try {
    const data = JSON.parse(decodeURIComponent(match[1])) as { _id?: unknown };

    return normalizeSessionId(data?._id);
  } catch {
    return '';
  }
}

function resolveCustomerClassId(user: User | null | undefined): number {
  const fromUser = Number(user?.classId ?? 0) || 0;
  if (fromUser > 0) {
    return fromUser;
  }

  const config = useRuntimeConfig().public;
  const fromConfig = Number(config.defaultCustomerClassId ?? 0) || 0;
  if (fromConfig > 0) {
    return fromConfig;
  }

  const fromB2BConfig = Number(config.defaultCustomerB2BClassId ?? 0) || 0;

  return fromB2BConfig > 0 ? fromB2BConfig : 0;
}

/**
 * Builds the FINDLY customer block from PWA session state (cart + user).
 * Cookies are not reliably forwarded to /rest/findly on cross-origin requests.
 */
export function getFindlyCustomerPayload(): FindlyCustomerPayload | null {
  const cartState = useCart();
  const customerState = useCustomer();
  const cart = cartState.data?.value;
  const user = customerState.user?.value;

  const classId = resolveCustomerClassId(user);
  const contactId = Number(user?.id ?? cart?.customerId ?? 0) || 0;
  const sessionId =
    normalizeSessionId(cart?.sessionId) ||
    readPlentyShopCookieSessionId();
  const isLoggedIn = Boolean(user?.email && !user?.guestMail);

  if (!sessionId && classId <= 0 && contactId <= 0 && !isLoggedIn) {
    return null;
  }

  return {
    class: classId,
    classId,
    id: contactId,
    sessionId,
    isLoggedIn,
  };
}

export function mergeFindlyCustomerIntoBody(body: Record<string, unknown>): Record<string, unknown> {
  const customer = getFindlyCustomerPayload();
  if (!customer) {
    return body;
  }

  const existing =
    typeof body.customer === 'object' && body.customer !== null
      ? (body.customer as Partial<FindlyCustomerPayload>)
      : null;

  const resolvedClass = Math.max(
    customer.class,
    Number(existing?.class ?? existing?.classId ?? 0) || 0,
  );

  return {
    ...body,
    customer: {
      ...existing,
      ...customer,
      class: resolvedClass,
      classId: resolvedClass,
      sessionId: customer.sessionId || normalizeSessionId(existing?.sessionId),
      id: customer.id || Number(existing?.id ?? 0) || 0,
      isLoggedIn: customer.isLoggedIn || Boolean(existing?.isLoggedIn),
    },
  };
}
