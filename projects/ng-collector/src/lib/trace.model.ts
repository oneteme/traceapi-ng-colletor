
export interface MainSession {
    '@type'?: string;
    name?: string;
    user?: string;
    start: number;
    end?: number;
    launchMode: string;
    location: string;
    application: ApplicationInfo
    exception?: ExceptionInfo
    requests: ApiRequest[]
}

export interface ApplicationInfo {
    name?: string;
    address?: string;
    version?: string;
    env?: string;
    os?: string;
    re?: string;
}

export interface ApiRequest {
    id?: string;
    method: string;
    protocol: string;
    host: string;
    port: number;
    path: string;
    query: string;
    contentType: string;
    authScheme?: string;
    status: number;
    inDataSize: number;
    ouDataSize: number;
    start: number;
    end: number;
    exception?: ExceptionInfo
}

export interface ExceptionInfo {
    classname: string;
    message: string;
}
