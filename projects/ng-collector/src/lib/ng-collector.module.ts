import { NgModule, APP_INITIALIZER, ModuleWithProviders } from '@angular/core';
import { HTTP_INTERCEPTORS, } from '@angular/common/http';
import { HttpInterceptorService } from './http-interceptor.service';
import { RouteTracerService } from './route-tracer.service';
import { getNumberOrCall, logTraceapi, requirePostitiveValue } from './util';

@NgModule({})
export class NgCollectorModule {

  static forRoot(host: string, configuration: ApplicationConf): ModuleWithProviders<NgCollectorModule> {
    if (configuration?.enabled && host && configuration?.sessionApi && configuration?.instanceApi ) {

       if(!requirePostitiveValue(getNumberOrCall(configuration?.delay),"delay") ||
          !requirePostitiveValue(getNumberOrCall(configuration?.bufferMaxSize),"bufferMaxSize") ){
            logTraceapi('warn','invalid Configuration, Ng-collector is disabled');
          return {ngModule: NgCollectorModule}
       }
 
      return {
        ngModule: NgCollectorModule,
        providers: [
          RouteTracerService,
          { provide: APP_INITIALIZER, useFactory: initializeRoutingEvents, deps: [RouteTracerService], multi: true },
          { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
          { provide: 'config', useValue: configuration },
          { provide: 'host', useValue: host }
        ]
      };
    }
    return {
      ngModule: NgCollectorModule
    }

  }
}

export function initializeRoutingEvents(routeTracerService: RouteTracerService) {
  return () => routeTracerService.initialize();
}

export interface ApplicationConf {
  name?: string | (() => string);
  version?: string | (() => string);
  env?: string | (() => string);
  user?: string | (() => string);
  bufferMaxSize?: number | (() => number);
  delay?: number| (() => number);
  instanceApi?: string | (() => string);
  sessionApi?: string | (() => string);
  enabled?: boolean;
}