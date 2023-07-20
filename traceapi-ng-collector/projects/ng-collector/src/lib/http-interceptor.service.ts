import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor, HttpEvent, HttpHandler, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid';
import { RouteTracerService } from './route-tracer.service';
import { ExceptionInfo, OutcomingRequest } from './trace.model';
import { dateNow } from './util';

@Injectable({ providedIn: 'root' })
export class HttpInterceptorService implements HttpInterceptor {

    constructor(private routerTracerService: RouteTracerService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const start = dateNow();
        let status: number, responseBody: any = '', exception: ExceptionInfo;
        const id = uuidv4();

        req = req.clone({
            setHeaders: { 'x-tracert': id }
        });

        return next.handle(req).pipe(tap(
            (event: any) => {
                if (event instanceof HttpResponse) {
                    status = +event.status;
                    responseBody = event.body
                }
            },
            error => {
                status = +error.status;
                exception = {
                    classname: error.error.error,
                    message: error.error.message
                }
            },
        ), finalize(() => {

            const url = toHref(req.url);
            let request: OutcomingRequest = {
                id: id,
                method: req.method,
                protocol: url.protocol.slice(0, -1),
                host: url.host.slice(0, url.host.length - 5),
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
            }
            this.routerTracerService.getCurrentSession().requests.push(request)
        }));
    }
}

function toHref(url: string): HTMLAnchorElement {
    const href = document.createElement('a');
    href.setAttribute('href', url);
    return href;
}

function extractAuthScheme(headers: any): string | undefined {
    return headers.has('authorization')
        ? headers.get('authorization').match(/^(\w+) /)?.at(1)
        : undefined;
}

function sizeOf(body: any): number {
    return body ? 0 : JSON.stringify(body).length
}
