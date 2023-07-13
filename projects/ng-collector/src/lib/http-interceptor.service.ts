import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor, HttpEvent, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid';
import { RouteTracerService } from './route-tracer.service';
import { ExceptionInfo, OutcomingRequest } from './trace.model';
import { dateNow } from './Util';
@Injectable({ providedIn: 'root' })
export class HttpInterceptorService implements HttpInterceptor {

    constructor(private routerTracerService: RouteTracerService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const start = dateNow();
        const authScheme = this.extractAuthScheme(req.headers)
        let status: number, responseBody: any = '', exception: ExceptionInfo;

        return next.handle(req).pipe(tap(
            (event: any) => {
                if (event instanceof HttpResponse ) {
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

            const url = this.getUrlInfo(req);
            var request: OutcomingRequest = {
                id: uuidv4(),
                method: req.method,
                protocol: url.protocol.slice(0, -1),
                host: url.host.slice(0, url.host.length - 5),
                port: +url.port,
                path: url.pathname,
                query: url.search.slice(1, url.search.length),
                contentType: req.responseType,
                authScheme: authScheme,
                status: +status,
                inDataSize: JSON.stringify(req.body).length,
                ouDataSize: JSON.stringify(responseBody).length,
                start: start,
                end: dateNow(),
                exception: exception
            }
            this.routerTracerService.getCurrentSession().requests.push(request)
        }));
    }

    extractAuthScheme(headers: any) {
        if (headers.has('authorization')) {
            const authMatch = headers.get('authorization').match(/^\w+/);
            return authMatch ? authMatch[0] : '';
        }
        return '';
    }

    getUrlInfo(req: HttpRequest<any>) {
        const url = document.createElement('a');
        url.setAttribute('href', req.url);
        return url;
    }


}

