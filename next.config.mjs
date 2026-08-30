/** @type {import('next').NextConfig} */
import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';
export default (phase) => ({
  // Keep dev and production artifacts isolated. Running `next build` must never
  // invalidate an active Chrome development preview.
  distDir: phase === PHASE_PRODUCTION_BUILD ? '.next-build' : '.next-dev',
  experimental: { typedRoutes: false }
});
