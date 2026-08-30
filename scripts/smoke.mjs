const base='http://localhost:3000';
const health=await fetch(`${base}/api/health`); if(!health.ok) throw new Error('health failed');
const search=await fetch(`${base}/api/books/search?q=reading`); const data=await search.json(); if(!Array.isArray(data.results)) throw new Error('search failed');
console.log('Smoke checks passed');
