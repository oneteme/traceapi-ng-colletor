import { Inject, Injectable} from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { ApplicationInfo, MainSession } from "./trace.model";
import { ApplicationConf } from "./ng-collector.module";
import { dateNow } from "./util";

@Injectable({ providedIn: 'root' })
export class RouteTracerService {

    traceServerMain: string;

    currentSession!: MainSession;
    applicationInfo !: ApplicationInfo;
    user?: string;
    constructor(private router: Router,
        @Inject('config') config: ApplicationConf,
        @Inject('url') url: string) {

        this.traceServerMain = url;
        this.applicationInfo = {
            name: getOrCall(config.name),
            address: undefined, //server side
            version: getOrCall(config.version),
            env: getOrCall(config.env),
            os: detectOs(),
            re: detectBrowser()
        }
        this.user = getOrCall(config.user);
    }

    initialize() {
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
                    application: this.applicationInfo,
                    requests: []
                }
            }

            if (event instanceof NavigationEnd) {
                this.currentSession.name = document.title;
                this.currentSession.location = document.URL;

            }
        })

    }

    sendSessions(currentSession: any) {
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify([currentSession])
        };
        fetch(this.traceServerMain, requestOptions)
            .catch(error => {
                console.error(error)
            })
    }

    getCurrentSession() {
        return this.currentSession;
    }

    endSession(){
        this.currentSession.end = dateNow();
        this.sendSessions(this.currentSession);
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

export function getOrCall(o?: string | (() => string)): string | undefined {
    return typeof o === "function" ? o() : o;
}




