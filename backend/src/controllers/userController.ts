import { HTTP_STATUS } from '@/constants/httpStatus.js'
import { COMMON_MESSAGES } from '@/constants/messages.js'

import { AppError } from '@/utils/AppError.js'
import type { EmptyRequest, TypedResponse } from '@/types/api.types.js'
export const authMe = async (req: EmptyRequest, res: TypedResponse) => {
  if (!req.user) {
    throw new AppError(COMMON_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }
  return res.status(HTTP_STATUS.OK).json({
    user: req.user
  })
}
