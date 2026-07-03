import { z } from "zod";

const HTTP_URL_REGEX = /^https?:\/\//i;

/*
 * HttpUrlSchema
 * A URL restricted to http(s) schemes — rejects `javascript:`/`data:`/etc.
 * Use for any user-supplied URL that later renders as an anchor `href`.
 */
export const HttpUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .refine((value) => HTTP_URL_REGEX.test(value), "URL must start with http:// or https://");
