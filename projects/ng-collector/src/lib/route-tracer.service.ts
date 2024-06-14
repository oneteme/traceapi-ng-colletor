import {  Inject, Injectable, OnDestroy} from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { InstanceEnvironment, MainSession } from "./trace.model";
import { ApplicationConf} from "./ng-collector.module";
import { dateNow, detectBrowser, detectOs, getNumberOrCall, getStringOrCall, logTraceapi } from "./util";
import { BehaviorSubject, from, interval, Observable, Subscription, tap } from "rxjs";


const SLASH = '/';
@Injectable({ providedIn: 'root' }) 
export class RouteTracerService  implements OnDestroy{

    logServerMain: string; 
    logInstanceEnv: string;
    sessionQueue: MainSession[]= [];
    currentSession!: MainSession; 
    instanceEnvironment !: InstanceEnvironment; 
    scheduledSessionSender: Subscription;
    user?: string;
    maxBufferSize: number
    delay:number
    sessionSendAttempts: number = 0 
    InstanceEnvSendAttempts: number = 0;
    trySendInstanceEnv:any;
    instance!: BehaviorSubject<string>;
    
    constructor(private router: Router,
        @Inject('config') config: ApplicationConf,
        @Inject('host') host: string) {

        
        this.logServerMain = this.sessionApiURL(host,getStringOrCall(config.sessionApi)!);
        this.logInstanceEnv = this.instanceApiURL(host,getStringOrCall(config.instanceApi)!);
        this.maxBufferSize =  getNumberOrCall(config.bufferMaxSize) || 3;
        this.delay = getNumberOrCall(config.delay) || 5000;
        this.instanceEnvironment = {
            name: getStringOrCall(config.name),
            version: getStringOrCall(config.version),
            address: undefined, //server side
            env: getStringOrCall(config.env),
            os: detectOs(),
            re: detectBrowser(),
            user: undefined, // cannot get user
            type: "CLIENT",
            instant: dateNow(),
            collector: "ng-collector-0.0.10"
        }
        this.user = getStringOrCall(config.user);

        this.scheduledSessionSender = interval(this.delay)
        .pipe(tap(()=> {this.sendSessions()}))
        .subscribe();
    }

    private beforeUnloadHandler = (event: BeforeUnloadEvent): void => {
        this.endSession(); 
        this.scheduledSessionSender.unsubscribe();
        this.sendSessions();
    }

    ngOnDestroy(): void { 
        window.removeEventListener('beforeunload',this.beforeUnloadHandler); 
        if(this.scheduledSessionSender){
            this.scheduledSessionSender.unsubscribe();
        }
        
    }

    initialize() {
        logTraceapi('log','initialize');
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
        this.router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                const now = dateNow();
                if (this.currentSession) {
                    this.endSession();
                }
                this.currentSession = {
                    '@type': "main",
                    user: this.user,
                    start: now,
                    launchMode: "WEBAPP",
                    location: event.url,
                    requests: []
                }
            }
            if (event instanceof NavigationEnd) {
                this.currentSession.name = document.title;
                this.currentSession.location = document.URL; 

            }
        })

    }

    sendSessions() {
        if(this.sessionQueue.length> 0){
            this.getInsertedInstanceId().subscribe((id:string|null)=>{
                if(id) {
                    let sessions: MainSession[] = [...this.sessionQueue];
                    this.sessionQueue.splice(0,sessions.length); // add rest of sessions 
                    logTraceapi('log',`sending sessions, attempts:${++this.sessionSendAttempts}, queue size : ${sessions.length}`)
                
                    const requestOptions = {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify(sessions)
                    };
                   
                    fetch(this.logServerMain, requestOptions)
                    .then(data=> {
                        if(data.ok){
                            logTraceapi('log','sessions sent successfully, queue size reset, new size is: '+this.sessionQueue.length)
                            this.sessionSendAttempts= 0;
                        }else{
                            logTraceapi('warn',`Error while attempting to send sessions, attempts: ${this.sessionSendAttempts}`)// 
                            this.revertQueueSize(sessions);
                        }
                    })
                    .catch(error => {
                        logTraceapi('warn',`Error while attempting to send sessions, attempts: ${this.sessionSendAttempts}`)// 
                        logTraceapi('warn',error)
                        this.revertQueueSize(sessions);
                    })

                }else { 
                    logTraceapi('warn',`Error while attempting to send Environement instance, attempts ${this.sessionSendAttempts}`);
                }
            })
        }
    }

    revertQueueSize(sessions: MainSession[]){
        this.sessionQueue.unshift(...sessions);
        if(this.sessionQueue.length > this.maxBufferSize ){
            let diff = this.sessionQueue.length - this.maxBufferSize;
            this.sessionQueue = this.sessionQueue.slice(0,this.maxBufferSize);
            logTraceapi('log','Buffer size exeeded the max size,last sessions have been removed from buffer, (number of sessions removed):'+diff)
        }
    }
  
    getCurrentSession() {
        return this.currentSession;
    }

    endSession(){
        this.currentSession.end = dateNow();
        this.sessionQueue.push(this.currentSession);
        logTraceapi('log',"added element to session queue, new size is: "+ this.sessionQueue.length);
    }

    getInsertedInstanceId() : Observable<any> {
        if(this.instance){
            return this.instance;
        }
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(this.instanceEnvironment)
        };
        this.sessionSendAttempts++;
        return from( fetch(this.logInstanceEnv,requestOptions)
        .then(res => res.ok ? res.text().then(id=> {
            this.instance = new BehaviorSubject<string>(id);
            this.logServerMain =this.logServerMain.replace(':id',id);
            this.sessionSendAttempts=0;
            logTraceapi('log','Environement instance sent successfully');
            return id;
        }) : null)
        .catch(err => {
            logTraceapi('warn',err)
            return null;
        }))  
    }

    instanceApiURL(host:string, path:string){
       return  this.toURL(host,path);
    }

    sessionApiURL(host:string, path:string){
       return  this.toURL(host,path);
    }

    toURL( host:string,  path:string ){
        return host.endsWith(SLASH) || path.startsWith(SLASH) ? host + path : [host,path].join(SLASH);
    }    
}

