import { NextFunction, RequestHandler, Response } from 'express'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import type { TypedRequest } from '@/types/api.types.js'

type AsyncRequestHandler<TBody, TParams, TQuery> = (
  req: TypedRequest<TBody, TParams, TQuery>,
  res: Response<unknown>,
  next: NextFunction
) => Promise<unknown>

export const asyncHandler =
  <TBody = unknown, TParams = ParamsDictionary, TQuery = Query>(
    handler: AsyncRequestHandler<TBody, TParams, TQuery>
  ): RequestHandler<TParams, unknown, TBody, TQuery> =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
