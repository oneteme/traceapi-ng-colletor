import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { v4 as uuidv4 } from 'uuid';
import { ApplicationInfo, MainRequest } from "./traceApp.model";

@Injectable({ providedIn: 'root' })
export class RouteTracerService {

    traceServerMain = "http://localhost:9006/trace/main/request"

    currentSession!: MainRequest;
    applicationInfo !: ApplicationInfo;

    constructor(private router: Router) {
        this.applicationInfo = {
            name: "",
            address: "",
            version: "",
            env: "",
            os: detectOs(),
            re: detectBrowser()
        }

    }

    initialize() {
        this.router.events.subscribe(event => {

            if (event instanceof NavigationEnd) {
                console.log("navigation")
                if (this.currentSession) { // change this 
                    this.currentSession.end = new Date(Date.now());
                    this.addMainRequests(this.currentSession);
                }

                this.currentSession = {
                    id: uuidv4(),
                    name: document.title,
                    user: "",
                    start: new Date(Date.now()),
                    end: undefined,
                    launchMode: "WEBAPP",
                    location: event.url,
                    threadName: "",
                    application: this.applicationInfo,
                    exception: undefined,
                    requests: []
                }
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
                console.log(error)
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




