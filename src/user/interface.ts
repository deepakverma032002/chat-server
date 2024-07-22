import { Request } from 'express'
import { Role } from 'src/types'

export interface RequestWithUser extends Request {
  user: {
    sub: string
    role: Role
  }
}
