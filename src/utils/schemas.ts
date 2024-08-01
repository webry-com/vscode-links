import { z } from "zod"

export const linkButtonSchema = z
  .object({
    title: z.string(),
    action: z
      .function()
      .args()
      .returns(z.void().or(z.promise(z.void()))),
  })
  .or(
    z.object({
      title: z.string(),
      target: z.string(),
    }),
  )
export const handlerResponseSchema = z.object({
  target: z.string(),
  tooltip: z.string().optional(),
  jumpPattern: z
    .any()
    .refine((val) => val instanceof RegExp || typeof val === "string")
    .optional(),
  description: z.string().optional(),
  buttons: z.array(linkButtonSchema).optional(),
})
export const configSchema = z.object({
  links: z.array(
    z.object({
      include: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .default("**/*"),
      exclude: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .default([]),
      pattern: z
        .any()
        .refine(
          (val): val is RegExp | RegExp[] =>
            val instanceof RegExp || (Array.isArray(val) && val.length > 0 && val.every((v) => v instanceof RegExp)),
        ),
      handle: z
        .function()
        .args(
          z.object({
            linkText: z.string(),
            workspace: z.any(),
            file: z.any(),
            log: z.any(),
          }),
        )
        .returns(handlerResponseSchema),
    }),
  ),
})
