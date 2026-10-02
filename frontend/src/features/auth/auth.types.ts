export type LoginCredentials = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}
