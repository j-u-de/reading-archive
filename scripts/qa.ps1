$ErrorActionPreference='Stop'
npx tsc --noEmit
npx next lint
npx next build
Write-Output 'QA checks passed. Start development separately with: npm run dev:clean'
