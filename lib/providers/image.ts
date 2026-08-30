export interface ImageAIProvider{generateBackground(input:{title:string;themes?:string[]}):Promise<{url:string;prompt:string}>}
export class FallbackImageAIProvider implements ImageAIProvider{async generateBackground(i:{title:string;themes?:string[]}){return {url:'',prompt:`为《${i.title}》生成无文字阅读海报背景`}}}
export const imageAIProvider:ImageAIProvider=new FallbackImageAIProvider();
