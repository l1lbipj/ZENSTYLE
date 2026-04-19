/** Dev defaults to mock auth unless `VITE_AUTH_MOCK=false`. Production uses the API unless `VITE_AUTH_MOCK=true`. */
export const useAuthMock =
  import.meta.env.PROD
    ? import.meta.env.VITE_AUTH_MOCK === 'true'
    : import.meta.env.VITE_AUTH_MOCK === 'true'
