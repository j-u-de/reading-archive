declare global {
  interface CloudflareEnv {
    ASSETS?: Fetcher;
    IMAGES?: ImagesBinding;
    NEXTJS_ENV?: string;
    WORKER_SELF_REFERENCE?: Service;
    NEXT_INC_CACHE_R2_BUCKET?: R2Bucket;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    AI_PROVIDER?: string;
    AI_BASE_URL?: string;
    AI_MODEL?: string;
    AI_API_KEY?: string;
    TEXT_AI_API_KEY?: string;
    IMAGE_AI_BASE_URL?: string;
    IMAGE_AI_MODEL?: string;
    IMAGE_AI_API_KEY?: string;
    IMAGE_AI_DASHSCOPE_BASE_URL?: string;
    IMAGE_AI_DASHSCOPE_MODEL?: string;
    IMAGE_AI_DASHSCOPE_API_KEY?: string;
    WEB_SEARCH_API_KEY?: string;
    PYTHON_PROXY_URL?: string;
  }
}

export {};
