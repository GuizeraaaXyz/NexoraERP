type MpFetchOptions = {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
};

const MP_API_BASE = "https://api.mercadopago.com";

function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN");
  }
  return token;
}

async function mpFetch<T>(path: string, options: MpFetchOptions = {}) {
  const token = getMercadoPagoAccessToken();
  const response = await fetch(`${MP_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body,
  });

  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    const message =
      (data as { message?: string })?.message ??
      `Mercado Pago request failed (${response.status}).`;
    throw new Error(message);
  }
  if (!data) {
    throw new Error("Mercado Pago response empty.");
  }
  return data;
}

export type MpPreapproval = {
  id: string;
  status: string;
  payer_email?: string;
  external_reference?: string;
  init_point?: string;
  preapproval_plan_id?: string;
  auto_recurring?: {
    start_date?: string;
    end_date?: string;
    transaction_amount?: number;
    currency_id?: string;
  };
};

export type MpAuthorizedPayment = {
  id: string | number;
  preapproval_id?: string;
  status?: string;
};

export async function createPreapproval(payload: Record<string, unknown>) {
  return mpFetch<MpPreapproval>("/preapproval", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPreapproval(id: string) {
  return mpFetch<MpPreapproval>(`/preapproval/${id}`);
}

export async function getAuthorizedPayment(id: string | number) {
  return mpFetch<MpAuthorizedPayment>(`/authorized_payments/${id}`);
}
