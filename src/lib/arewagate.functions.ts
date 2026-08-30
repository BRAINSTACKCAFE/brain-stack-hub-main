import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

interface ArewagateTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ArewagateAuthContext {
  accessToken: string | null;
  expiresAt: number | null;
}

// Simple in-memory token cache (in production, consider using Redis or similar)
let tokenCache: ArewagateAuthContext = {
  accessToken: null,
  expiresAt: null,
};

// Prevents concurrent requests from all firing separate token fetches
let tokenFetchPromise: Promise<{ accessToken: string }> | null = null;

/**
 * Get an access token from Arewagate using API keys
 *
 * This server function exchanges your public_key and secret_key for a Bearer access token.
 * The token is cached and automatically refreshed when needed (expires in 1 hour).
 *
 * @returns {Object} Object containing the access_token
 * @throws {Error} If API keys are not configured or token request fails
 */
export const getArewagateAccessToken = createServerFn({ method: "POST" }).handler(
  async () => {
    const publicKey = process.env.AREWAGATE_PUBLIC_KEY;
    const secretKey = process.env.AREWAGATE_SECRET_KEY;

    if (!publicKey || !secretKey) {
      throw new Error("Arewagate API keys are not configured");
    }

    // Check if we have a valid cached token
    const now = Date.now();
    if (
      tokenCache.accessToken &&
      tokenCache.expiresAt &&
      tokenCache.expiresAt > now + 30000 // Refresh 30 seconds before expiry
    ) {
      return { accessToken: tokenCache.accessToken };
    }

    // If a fetch is already in-flight, reuse it instead of firing a duplicate request
    if (tokenFetchPromise) {
      return tokenFetchPromise;
    }

    tokenFetchPromise = (async () => {
      try {
        const response = await fetch("https://arewagate.com/api/v1/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            public_key: publicKey,
            secret_key: secretKey,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to get Arewagate token: ${response.status} - ${errorText}`
          );
        }

        const data: ArewagateTokenResponse = await response.json();

        tokenCache = {
          accessToken: data.access_token,
          expiresAt: now + data.expires_in * 1000,
        };

        return { accessToken: data.access_token };
      } finally {
        tokenFetchPromise = null;
      }
    })();

    return tokenFetchPromise;
  }
);

/**
 * Clear the cached Arewagate access token
 *
 * Useful for testing or when you need to force a fresh token request.
 */
export const clearArewagateTokenCache = createServerFn({ method: "POST" }).handler(
  () => {
    tokenCache = {
      accessToken: null,
      expiresAt: null
    };
    return { success: true };
  }
);

/**
 * Make an authenticated request to Arewagate API
 *
 * This server function handles making authenticated requests to the Arewagate API
 * by automatically obtaining and attaching a Bearer token.
 *
 * @param endpoint - API endpoint (without base URL, e.g., "user/wallet")
 * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param body - Request body (will be JSON stringified). Ignored for GET/HEAD.
 * @param headers - Additional headers to include in the request. Cannot override
 *   Authorization or Content-Type.
 * @returns {Promise<any>} The API response (parsed as JSON if applicable)
 * @throws {Error} If the request fails or returns an error status
 */
export const arewagateRequest = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        endpoint: z.string(),
        method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
        body: z.any().optional(),
        headers: z.record(z.string()).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const tokenResponse = await getArewagateAccessToken();
    const accessToken = tokenResponse.accessToken;

    if (!accessToken) {
      throw new Error("Arewagate access token unavailable");
    }

    const isBodylessMethod = data.method === "GET" || data.method === "HEAD";

    let response: Response;
    try {
      response = await fetch(
        `https://arewagate.com/api/v1/${data.endpoint.replace(/^\/+/, "")}`,
        {
          method: data.method,
          headers: {
            // caller-supplied headers spread first so they can never
            // clobber the auth/content-type headers below
            ...(data.headers ?? {}),
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: !isBodylessMethod && data.body ? JSON.stringify(data.body) : undefined,
        }
      );
    } catch (err) {
      throw new Error(
        `Arewagate API request failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Arewagate API error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  });

/**
 * Get wallet balance from Arewagate
 *
 * Retrieves the current wallet balance from the Arewagate API.
 *
 * @returns {Object} Object containing the wallet balance data
 * @throws {Error} If the request fails
 */
export const getWalletBalance = createServerFn({ method: "POST" }).handler(
  async () => {
    const data = await arewagateRequest({
      data: { endpoint: "user/wallet", method: "GET" },
    });
    return { success: true, data };
  }
);

/**
 * Get available airtime networks from Arewagate
 *
 * Retrieves the list of supported airtime networks.
 *
 * @returns {Object} Object containing the airtime networks data
 * @throws {Error} If the request fails
 */
export const getAirtimeNetworks = createServerFn({ method: "POST" }).handler(
  async () => {
    const data = await arewagateRequest({
      data: { endpoint: "airtime/networks", method: "GET" },
    });
    return { success: true, data };
  }
);

/**
 * Purchase airtime via Arewagate
 *
 * Buys airtime for a specific phone number and network.
 *
 * @param {Object} params - The airtime purchase parameters
 * @param {string} params.phone - Phone number to recharge
 * @param {string} params.network - Network provider (mtn, glo, airtel, 9mobile, etc.)
 * @param {number} params.amount - Amount in NGN
 * @returns {Object} Object containing the purchase result
 * @throws {Error} If the request fails
 */
export const purchaseAirtime = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        phone: z.string().regex(/^(0|\+234)?[789]\d{9}$/, "Invalid phone number"),
        network: z.enum(["mtn", "glo", "airtel", "9mobile", "etisalat"]),
        amount: z.number().int().min(50, "Amount must be at least ₦50"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: "airtime/purchase",
        method: "POST",
        body: {
          phone: data.phone,
          network: data.network,
          amount: data.amount,
        },
      },
    });
    return { success: true, data: result };
  });

/**
 * Get available data plans from Arewagate
 *
 * Retrieves data subscription plans for a specific network.
 *
 * @param {Object} params - The data plan parameters
 * @param {string} params.network - Network provider (mtn, glo, airtel, 9mobile, etc.)
 * @returns {Object} Object containing the data plans data
 * @throws {Error} If the request fails
 */
export const getDataPlans = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        network: z.enum(["mtn", "glo", "airtel", "9mobile", "etisalat"]),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: "data-subscription/get-plans",
        method: "POST",
        body: {
          network: data.network,
        },
      },
    });
    return { success: true, data: result };
  });

/**
 * Purchase data bundle via Arewagate
 *
 * Buys a data bundle for a specific phone number and network.
 *
 * @param {Object} params - The data purchase parameters
 * @param {string} params.phone - Phone number for data activation
 * @param {string} params.network - Network provider (mtn, glo, airtel, 9mobile, etc.)
 * @param {string} params.plan - Data plan identifier or code
 * @returns {Object} Object containing the purchase result
 * @throws {Error} If the request fails
 */
export const purchaseData = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        phone: z.string().regex(/^(0|\+234)?[789]\d{9}$/, "Invalid phone number"),
        network: z.enum(["mtn", "glo", "airtel", "9mobile", "etisalat"]),
        plan: z.string().min(1, "Plan is required"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: "data-subscription/purchase",
        method: "POST",
        body: {
          phone: data.phone,
          network: data.network,
          plan: data.plan,
        },
      },
    });
    return { success: true, data: result };
  });

/**
 * Get utility bill categories from Arewagate
 *
 * Retrieves the list of supported utility bill categories.
 *
 * @returns {Object} Object containing the utility bill categories data
 * @throws {Error} If the request fails
 */
export const getUtilityBillCategories = createServerFn({ method: "POST" }).handler(
  async () => {
    const data = await arewagateRequest({
      data: { endpoint: "utility-bills/categories", method: "GET" },
    });
    return { success: true, data };
  }
);

/**
 * Get utility bill providers for a category from Arewagate
 *
 * Retrieves providers for a specific utility bill category.
 *
 * @param {Object} params - The utility bill provider parameters
 * @param {string} params.category - Utility bill category (e.g., "electricity", "tv", "water")
 * @returns {Object} Object containing the utility bill providers data
 * @throws {Error} If the request fails
 */
export const getUtilityBillProviders = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        category: z.string().min(1, "Category is required"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: `utility-bills/providers/${data.category}`,
        method: "GET",
      },
    });
    return { success: true, data: result };
  });

/**
 * Verify utility bill details via Arewagate
 *
 * Verifies customer details for a utility bill before payment.
 *
 * @param {Object} params - The utility bill verification parameters
 * @param {string} params.category - Utility bill category
 * @param {string} params.provider - Utility bill provider
 * @param {string} params.customerId - Customer identifier (meter number, account number, etc.)
 * @returns {Object} Object containing the verification result
 * @throws {Error} If the request fails
 */
export const verifyUtilityBill = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        category: z.string().min(1, "Category is required"),
        provider: z.string().min(1, "Provider is required"),
        customerId: z.string().min(1, "Customer ID is required"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: "utility-bills/verify",
        method: "POST",
        body: {
          category: data.category,
          provider: data.provider,
          customer_id: data.customerId,
        },
      },
    });
    return { success: true, data: result };
  });

/**
 * Pay utility bill via Arewagate
 *
 * Pays a utility bill for a specific customer.
 *
 * @param {Object} params - The utility bill payment parameters
 * @param {string} params.category - Utility bill category (e.g., "electricity", "tv")
 * @param {string} params.provider - Utility bill provider
 * @param {string} params.customerId - Customer identifier (meter number, account number, etc.)
 * @param {number} params.amount - Amount to pay in NGN
 * @returns {Object} Object containing the payment result
 * @throws {Error} If the request fails
 */
export const payUtilityBill = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        category: z.string().min(1, "Category is required"),
        provider: z.string().min(1, "Provider is required"),
        customerId: z.string().min(1, "Customer ID is required"),
        amount: z.number().positive("Amount must be positive"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: "utility-bills/pay",
        method: "POST",
        body: {
          category: data.category,
          provider: data.provider,
          customer_id: data.customerId,
          amount: data.amount,
        },
      },
    });
    return { success: true, data: result };
  });

/**
 * Get verification types from Arewagate
 *
 * Retrieves the list of supported verification types.
 *
 * @returns {Object} Object containing the verification types data
 * @throws {Error} If the request fails
 */
export const getVerificationTypes = createServerFn({ method: "POST" }).handler(
  async () => {
    const data = await arewagateRequest({
      data: { endpoint: "verification/types", method: "GET" },
    });
    return { success: true, data };
  }
);

/**
 * Verify NIN via Arewagate
 *
 * Verifies a Nigerian National Identification Number.
 *
 * @param {Object} params - The NIN verification parameters
 * @param {string} params.nin - The NIN to verify (11 digits)
 * @returns {Object} Object containing the verification result
 * @throws {Error} If the request fails
 */
export const verifyNIN = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        nin: z.string().length(11, "NIN must be exactly 11 digits"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GETID_API_KEY;
    if (!apiKey) {
      throw new Error("GetID API key is not configured");
    }

    try {
      const response = await fetch("https://getid.com.ng/api/nin.php", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: data.nin,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `GetID API request failed: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      // Re-throw with more context if needed
      if (error instanceof Error) {
        throw new Error(`NIN verification failed: ${error.message}`);
      }
      throw error;
    }
  });

/**
 * Verify BVN via GetID API
 *
 * Verifies a Nigerian Bank Verification Number using the GetID service.
 *
 * @param {Object} params - The BVN verification parameters
 * @param {string} params.bvn - The BVN to verify (exactly 11 digits)
 * @returns {Object} Object containing the verification result
 * @throws {Error} If the request fails or API key is not configured
 */
export const verifyBVN = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        bvn: z.string().length(11, "BVN must be exactly 11 digits"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GETID_API_KEY;
    if (!apiKey) {
      throw new Error("GetID API key is not configured");
    }

    try {
      const response = await fetch("https://getid.com.ng/api/bvn.php", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: data.bvn,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `GetID API request failed: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      // Re-throw with more context if needed
      if (error instanceof Error) {
        throw new Error(`BVN verification failed: ${error.message}`);
      }
      throw error;
    }
  });

/**
 * Verify CAC company registration via Arewagate
 *
 * Verifies a company by its RC number.
 *
 * @param {Object} params - The CAC verification parameters
 * @param {string} params.rcNumber - The RC number to verify
 * @returns {Object} Object containing the verification result
 * @throws {Error} If the request fails
 */
export const verifyCAC = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        rcNumber: z.string().min(1, "RC number is required"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: "verification/cac",
        method: "POST",
        body: {
          rc_number: data.rcNumber,
        },
      },
    });
    return { success: true, data: result };
  });

/**
 * Get scratch card details from Arewagate
 *
 * Retrieves details for a specific scratch card service.
 *
 * @param {Object} params - The scratch card parameters
 * @param {string} params.slug - The scratch card slug (e.g., "waec", "neco")
 * @returns {Object} Object containing the scratch card details
 * @throws {Error} If the request fails
 */
export const getScratchCardDetails = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1, "Slug is required"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: { endpoint: `scratch-card/${data.slug}`, method: "GET" },
    });
    return { success: true, data: result };
  });

/**
 * Purchase scratch card via Arewagate
 *
 * Purchases one or more scratch cards.
 *
 * @param {Object} params - The scratch card purchase parameters
 * @param {string} params.slug - The scratch card slug (e.g., "waec", "neco")
 * @param {number} params.quantity - The quantity of cards to purchase
 * @returns {Object} Object containing the purchase result
 * @throws {Error} If the request fails
 */
export const purchaseScratchCard = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1, "Slug is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: "scratch-card/purchase",
        method: "POST",
        body: {
          slug: data.slug,
          quantity: data.quantity,
        },
      },
    });
    return { success: true, data: result };
  });

/**
 * Get JAMB service details from Arewagate
 *
 * Retrieves details for JAMB PIN service.
 *
 * @returns {Object} Object containing the JAMB service details
 * @throws {Error} If the request fails
 */
export const getJAMBServiceDetails = createServerFn({ method: "POST" }).handler(
  async () => {
    const result = await arewagateRequest({
      data: { endpoint: "jamb-service/jamb-pin", method: "GET" },
    });
    return { success: true, data: result };
  }
);

/**
 * Purchase JAMB service via Arewagate
 *
 * Purchases JAMB PIN(s).
 *
 * @param {Object} params - The JAMB purchase parameters
 * @param {number} params.quantity - The quantity of PINs to purchase
 * @returns {Object} Object containing the purchase result
 * @throws {Error} If the request fails
 */
export const purchaseJAMBService = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: "jamb-service/purchase",
        method: "POST",
        body: {
          quantity: data.quantity,
        },
      },
    });
    return { success: true, data: result };
  });

/**
 * List transactions from Arewagate
 *
 * Retrieves a list of transactions with optional filtering.
 *
 * NOTE: per the Arewagate quick-start docs, the documented route is
 * `GET /v1/transactions` (plural, no "/request-all" suffix). This was
 * corrected from the original `transaction/request-all`, which does not
 * match the documented API surface.
 *
 * @param {Object} params - The transaction listing parameters
 * @param {number} [params.perPage] - Number of transactions per page
 * @param {string} [params.category] - Filter by category (e.g., "airtime", "data")
 * @param {string} [params.status] - Filter by status (e.g., "completed", "pending")
 * @returns {Object} Object containing the transactions list and pagination info
 * @throws {Error} If the request fails
 */
export const listTransactions = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        perPage: z.number().int().min(1).optional(),
        category: z.string().optional(),
        status: z.string().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    // Build query parameters
    const params = new URLSearchParams();
    if (data.perPage) params.append("per_page", data.perPage.toString());
    if (data.category) params.append("category", data.category);
    if (data.status) params.append("status", data.status);

    const queryString = params.toString();
    const endpoint = queryString ? `transactions?${queryString}` : "transactions";

    const result = await arewagateRequest({
      data: { endpoint, method: "GET" },
    });
    return { success: true, data: result };
  });

/**
 * Get transaction details from Arewagate
 *
 * Retrieves details for a specific transaction.
 *
 * NOTE: the Arewagate quick-start doc excerpt only documents the plural
 * `GET /v1/transactions` list endpoint — it does not show a dedicated
 * single-transaction-by-ID route. The path below (`transaction/request/{id}`)
 * is UNVERIFIED against the doc excerpt provided; it did not match the
 * naming convention used by every other documented endpoint (plural,
 * no "/request/" segment), and going by that alone it should probably be
 * removed. Before relying on this function, check the full reference at
 * https://arewagate.apidog.io/ for the real single-transaction path — it
 * may not exist at all, in which case filter the result of
 * `listTransactions` client-side by ID instead.
 *
 * @param {Object} params - The transaction parameters
 * @param {string} params.transactionId - The transaction ID
 * @returns {Object} Object containing the transaction details
 * @throws {Error} If the request fails
 */
export const getTransactionDetails = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        transactionId: z.string().min(1, "Transaction ID is required"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const result = await arewagateRequest({
      data: {
        endpoint: `transaction/request/${data.transactionId}`,
        method: "GET",
      },
    });
    return { success: true, data: result };
  });

/**
 * HOW TO USE THIS IN YOUR SITE:
 *
 * 1. ADD API KEYS TO .env FILE:
 *    AREWAGATE_PUBLIC_KEY=your_actual_public_key_here
 *    AREWAGATE_SECRET_KEY=your_actual_secret_key_here
 *
 * 2. IN YOUR SERVER FUNCTIONS, ROUTES, OR CLIENT COMPONENTS:
 *    Import and call the exported server functions. Remember that any
 *    function defined with `.inputValidator(...)` must be called with its
 *    payload wrapped in a `data` key, e.g. `purchaseAirtime({ data: {...} })`.
 *    Functions with no validator (like `getWalletBalance`) take no arguments.
 *
 * 3. EXAMPLE USAGE:
 *
 *    import { getWalletBalance, purchaseAirtime } from "@/lib/arewagate.functions";
 *
 *    const balance = await getWalletBalance();
 *
 *    const purchase = await purchaseAirtime({
 *      data: { phone: "08012345678", network: "mtn", amount: 500 },
 *    });
 *
 * 4. CREATING API ROUTES (OPTIONAL):
 *    If you want to create dedicated API routes for Arewagate integration:
 *    - Create a file in src/routes/api/arewagate/[name].route.ts
 *    - Call the relevant exported function inside your route handlers
 *    - Example structure:
 *      src/
 *        routes/
 *          api/
 *            arewagate/
 *              users.route.ts
 *              data.route.ts
 *
 * 5. SECURITY NOTE:
 *    All API keys and token handling happens on the server-side.
 *    Never expose your API keys to the client-side code.
 *    The arewagateRequest function is designed to be used by other server
 *    functions only.
 *
 * 6. TOKEN MANAGEMENT:
 *    The library automatically caches tokens and refreshes them when needed
 *    (tokens expire in 1 hour according to the API documentation), and
 *    de-duplicates concurrent token requests so only one refresh happens
 *    at a time. You can manually clear the cache using
 *    clearArewagateTokenCache() if needed. Note: this in-memory cache does
 *    not persist across serverless invocations/regions — use Redis or
 *    similar for production deployments with multiple instances.
 *
 * 7. VERIFY ENDPOINTS AGAINST THE FULL API REFERENCE:
 *    This file was corrected against a partial quick-start doc excerpt.
 *    `listTransactions` was fixed to use `GET /v1/transactions` to match
 *    that doc. `getTransactionDetails` uses an unverified path — check
 *    https://arewagate.apidog.io/ before shipping it.
 */