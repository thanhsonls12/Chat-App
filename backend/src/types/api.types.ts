import type { Request, Response } from 'express'
import type { ParamsDictionary, Query } from 'express-serve-static-core'

export type TypedRequest<TBody = unknown, TParams = ParamsDictionary, TQuery = Query> = Request<
  TParams,
  unknown,
  TBody,
  TQuery
>

export type TypedResponse = Response<unknown>

export type EmptyRequest = TypedRequest

export interface MessageResponse {
  message: string
}

export interface ErrorResponse {
  message: string
  errors?: Record<string, { msg: string; [key: string]: unknown }>
}
