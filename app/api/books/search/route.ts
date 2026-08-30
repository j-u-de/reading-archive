import { NextResponse } from 'next/server';
import { bookMetadataProvider } from '../../../../lib/providers/book-metadata';
export async function GET(request:Request){const query=(new URL(request.url).searchParams.get('q')||'').trim().slice(0,120);if(!query)return NextResponse.json({results:[]});try{const results=await bookMetadataProvider.searchBooks(query);return NextResponse.json({results,source:results.length?'live':'unavailable',message:results.length?'':'实时书籍服务暂不可用'})}catch{return NextResponse.json({results:[],source:'unavailable',message:'实时书籍服务暂不可用'},{status:503})}}
