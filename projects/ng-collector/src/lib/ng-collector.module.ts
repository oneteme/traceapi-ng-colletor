import { NgModule ,APP_INITIALIZER, ModuleWithProviders} from '@angular/core';
import { HTTP_INTERCEPTORS, } from '@angular/common/http';
import { HttpInterceptorService } from './http-interceptor.service';
import { RouteTracerService } from './route-tracer.service';
import { CommonModule } from '@angular/common';




@NgModule({
})
export class NgCollectorModule {

  static forRoot(url:string, configuration:ApplicationConf) :ModuleWithProviders<NgCollectorModule>{
    return {
      ngModule : NgCollectorModule,
        providers : [
          RouteTracerService,
          { provide: APP_INITIALIZER, useFactory: initializeRoutingEvents, deps:[RouteTracerService],multi:true},
          { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
          { provide: 'config', useValue: configuration},
          { provide: 'url', useValue: url}
        ]
      };
  }
}

export function initializeRoutingEvents(routeTracerService: RouteTracerService) {
  return () => routeTracerService.initialize();
}

export interface ApplicationConf {
    name?: string | (()=> string);
    version?:string | (()=> string);
    user?: () => string;
}
