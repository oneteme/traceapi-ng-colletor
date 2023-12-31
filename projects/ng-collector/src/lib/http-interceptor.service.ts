import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor, HttpEvent, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators'
import { RouteTracerService } from './route-tracer.service';
import { ExceptionInfo } from './trace.model';
import { dateNow } from './util';

@Injectable({ providedIn: 'root' })
export class HttpInterceptorService implements HttpInterceptor {

    constructor(private routerTracerService: RouteTracerService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const start = dateNow();
        let status: number, responseBody: any = '', exception: ExceptionInfo;
        let id: string| undefined;
        return next.handle(req).pipe(tap(
            (event: any) => {
                if (event instanceof HttpResponse) {
                    status = +event.status;
                    responseBody = event.body
                    id = getReqid(event.headers);
                }
            },
            error => {
                console.log(error)
                id = getReqid(error.headers);
                status = +error.status;
                exception = {
                    classname: error.error.error,
                    message: error.error.message
                }
            },
        ), finalize(() => {

            const url = toHref(req.urlWithParams);
            this.routerTracerService.getCurrentSession().requests.push({
                id: id,
                method: req.method,
                protocol: url.protocol.slice(0, -1),
                host: exctractHost(url.host),
                port: +url.port,
                path: url.pathname,
                query: url.search.slice(1, url.search.length),
                contentType: req.responseType,
                authScheme: extractAuthScheme(req.headers),
                status: +status,
                inDataSize: sizeOf(responseBody),
                ouDataSize: sizeOf(req.body),
                start: start,
                end: dateNow(),
                exception: exception
            });
        }));
    }
}

function toHref(url: string): HTMLAnchorElement {
    const href = document.createElement('a');
    href.setAttribute('href', url);
    return href;
}

function exctractHost(path: string) {
    const portregex = /:\d+/;
    return path.replace(portregex, '')
}

function extractAuthScheme(headers: any): string | undefined {
    return headers.has('authorization')
        ? headers.get('authorization').match(/^(\w+) /)?.at(1)
        : undefined;
}

function getReqid(headers:any):string | undefined {
    return headers.has('x-tracert')
        ? headers.get('x-tracert')
        : undefined;
}

function sizeOf(body: any): number {
    return body ? JSON.stringify(body).length : 0;
}
