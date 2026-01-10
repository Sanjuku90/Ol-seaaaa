import { z } from 'zod';
import { insertUserSchema, users, machines, contracts, transactions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema.extend({ referralCode: z.string().optional() }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  machines: {
    list: {
      method: 'GET' as const,
      path: '/api/machines',
      responses: {
        200: z.array(z.custom<typeof machines.$inferSelect>()),
      },
    },
  },
  contracts: {
    list: {
      method: 'GET' as const,
      path: '/api/contracts',
      responses: {
        200: z.array(z.custom<typeof contracts.$inferSelect & { machine: typeof machines.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/contracts',
      input: z.object({
        machineId: z.number(),
        amount: z.number(),
        autoReinvest: z.boolean(),
      }),
      responses: {
        201: z.custom<typeof contracts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions',
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions',
      input: z.object({
        type: z.enum(['deposit', 'withdrawal']),
        amount: z.number(),
        walletAddress: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          totalPower: z.number(),
          totalDistributed: z.number(),
          activeMiners: z.number(),
        }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type LoginRequest = z.infer<typeof api.auth.login.input>;
export type RegisterRequest = z.infer<typeof api.auth.register.input>;
export type CreateContractRequest = z.infer<typeof api.contracts.create.input>;
