Rails.application.config.middleware.use OmniAuth::Builder do
  provider(
    :auth0,
    '7ounT2Ohg2gZ6tuuGAFFjGfzupCjcfc2',
    'nm_djl_qR5L-gJFYArNoGB1zpKa7Npzty5LHQJJyW5Fp8Hz10bBh2I-2BojAJVHn',
    'ryanbreen.auth0.com',
    callback_path: "/auth/auth0/callback"
  )
end