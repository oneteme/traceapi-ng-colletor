import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid';
import { RouteTracerService } from './route-tracer.service';
import { ExceptionInfo, OutcomingRequest } from './traceApp.model';
@Injectable({ providedIn: 'root' })
export class HttpInterceptorService implements HttpInterceptor {

    constructor(private routerTracerService: RouteTracerService) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        /*const authReq = req.clone({
            setHeaders: {
                Authorization: "Bearer 45O3JHMO3H45O3IH453OH45OI3H45"
            }
        });*/


        const start = new Date(Date.now())
        const authScheme = this.extractAuthScheme(req.headers)
        var status: number, responseBody: any, exception: ExceptionInfo;

        return next.handle(req).pipe(tap(
            (event: any) => { 
                if (event.type == 4) {
                    status = +event.status;
                    responseBody = event.body
                }
            }, 
            error => {
                status = +error.status;
                responseBody = ""
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
                end: new Date(Date.now()),
                threadName: "",
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

