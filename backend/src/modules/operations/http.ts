import { ApiError } from "@/shared/errors";
import { NextFunction, Request, Response } from "express";
import * as schema from "./schemas";
type Handler = (req: Request, res: Response) => Promise<unknown>;
export const run =
  (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
export const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });
export const user = (req: Request) => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const params = (req: Request) => schema.id.parse(req.params.id);
export function pagination(req: Request) {
  const q = schema.listInput.parse(req.query);
  return { ...q, skip: (q.page - 1) * q.limit, take: q.limit };
}
export const page = (
  items: unknown[],
  total: number,
  q: ReturnType<typeof pagination>,
) => ({ items, total, page: q.page, totalPages: Math.ceil(total / q.limit) });
