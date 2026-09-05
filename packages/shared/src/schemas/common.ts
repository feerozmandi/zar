import { z } from "zod";
import { ROLES, BILLABLE_MODULES } from "../constants.js";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idSchema = z.string().min(1);

export const roleSchema = z.enum(Object.values(ROLES) as [string, ...string[]]);

export const moduleKeySchema = z.enum(BILLABLE_MODULES);

export const apiEnvelopeSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.boolean(),
    data,
    meta: z
      .object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        total: z.number().optional(),
      })
      .optional(),
    message: z.string().optional(),
  });

export type Pagination = z.infer<typeof paginationSchema>;
