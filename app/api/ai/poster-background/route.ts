import {NextResponse} from 'next/server'; import {imageAIProvider} from '../../../../lib/providers/image';
export async function POST(req:Request){try{return NextResponse.json(await imageAIProvider.generateBackground(await req.json()))}catch{return NextResponse.json({url:'',retryable:true},{status:503})}}
