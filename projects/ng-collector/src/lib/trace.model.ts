
export interface MainRequest {
    id: string;
    name: string;
    user: string;
    start: Date;
    end?: Date;
    launchMode: string;
    location: string;
    application: ApplicationInfo
    exception?: ExceptionInfo
    requests: OutcomingRequest[]
}

export interface ApplicationInfo {
    name: string;
    address: string;
    version: string;
    env: string;
    os?: string;
    re?: string;
}

export interface OutcomingRequest {
    id: string;
    method: string;
    protocol: string;
    host: string;
    port: number;
    path: string;
    query: string;
    contentType: string;
    authScheme: string;
    status: number;
    inDataSize: number;
    ouDataSize: number;
    start: Date;
    end: Date;
    exception?: ExceptionInfo
}

export interface ExceptionInfo {
    classname: string;
    message: string;
}