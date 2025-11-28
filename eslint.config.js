import { FlatCompat } from '@eslint/eslintrc/dist/eslintrc.cjs'

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  ...compat.extends('next/core-web-vitals'),
]
