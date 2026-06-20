import { JwtPayload } from 'jsonwebtoken'

export interface AccessTokenPayload extends JwtPayload {
  userId: string
}

export interface SignUpBody {
  username: string
  password: string
  email: string
  firstName: string
  lastName: string
}

export interface SignInBody {
  username: string
  password: string
}
