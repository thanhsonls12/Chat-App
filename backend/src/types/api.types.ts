import type { Request, Response } from 'express'
import type { ParamsDictionary, Query } from 'express-serve-static-core'

/**
 * Typed Express request. Dùng thay cho `Request` mặc định để `req.body`,
 * `req.params`, `req.query` không còn là `any`.
 */
export type TypedRequest<TBody = unknown, TParams = ParamsDictionary, TQuery = Query> = Request<
  TParams,
  unknown,
  TBody,
  TQuery
>

/** Response không ràng buộc shape body (các controller trả nhiều dạng khác nhau). */
export type TypedResponse = Response<unknown>

/** Request không có body/params/query riêng (GET đơn giản). */
export type EmptyRequest = TypedRequest

export interface MessageResponse {
  message: string
}

export interface ErrorResponse {
  message: string
  errors?: Record<string, { msg: string; [key: string]: unknown }>
}
