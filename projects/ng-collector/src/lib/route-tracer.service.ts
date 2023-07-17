import { Inject, Injectable } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { v4 as uuidv4 } from 'uuid';
import { ApplicationInfo, MainRequest } from "./trace.model";
import { ApplicationConf } from "./ng-collector.module";
import { dateNow } from "./util";


@Injectable({ providedIn: 'root' })
export class RouteTracerService {

    traceServerMain:string;

    currentSession!: MainRequest;
    applicationInfo !: ApplicationInfo;
    user?: string;
    constructor(private router: Router,
                @Inject('config') private config:ApplicationConf,
                @Inject('url') private  url:string ) {

        this.traceServerMain = this.url;
        this.applicationInfo = {
            name: getOrCall(this.config.name),
            address: undefined, //TODO
            version: getOrCall(this.config.version),
            env: getOrCall(this.config.env),
            os: detectOs(),
            re: detectBrowser()
        }
       this.user = getOrCall(this.config.user);
    }

    initialize() {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationStart){

                if (this.currentSession) {
                    this.currentSession.end = dateNow();
                    this.addMainRequests(this.currentSession);
                }
                this.currentSession = {
                    id: uuidv4(),
                    user: this.user,
                    start: dateNow(),
                    launchMode: "WEBAPP",
                    location: event.url,
                    application: this.applicationInfo,
                    requests: []
                }
            }

            if (event instanceof NavigationEnd) {

                this.currentSession.end = dateNow();
                this.currentSession.name = document.title;
                this.currentSession.location = document.URL;

            }
        })

    }

    addMainRequests(currentSession: any) {
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(currentSession)
        };
        fetch(this.traceServerMain, requestOptions)
            .catch(error => {
                console.error(error)
            })
    }

    getCurrentSession() {
        return this.currentSession;
    }
}

function detectBrowser() {
    try {
        const agent = window.navigator.userAgent.toLowerCase()
        switch (true) {
            case agent.indexOf('edge') > -1:
                return 'edge';
            case agent.indexOf('opr') > -1:
                return 'opera';
            case agent.indexOf('chrome') > -1:
                return 'chrome';
            case agent.indexOf('firefox') > -1:
                return 'firefox';
            case agent.indexOf('safari') > -1:
                return 'safari';
        }
    }
    catch (e) {
        console.error(e);
    }
    return undefined;

}

function detectOs() {
    try {
        let versionMatch, version;
        const agent = window.navigator.userAgent.toLowerCase()
        switch (true) {
            case (/windows/.test(agent)):

                versionMatch = /windows nt (\d+\.\d+)/.exec(agent);
                version = versionMatch ? versionMatch[1] : 'Unknown';
                return `Windows ${version}`;
            case (/linux/.test(agent)):
                return 'Linux';

            case (/macintosh/.test(agent)):
                versionMatch = /mac os x (\d+[._]\d+[._]\d+)/.exec(agent);
                version = versionMatch ? versionMatch[1] : 'Unknown';
                return `MacOs ${version}`
        }
    }
    catch (e) {
        console.error(e);
    }
    return undefined;
}

export function getOrCall(o?: string | (()=> string)) : string | undefined {
    return typeof o === "function" ? o() : o;
}




