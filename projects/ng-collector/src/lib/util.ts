let WIN:any = window;
let c:any = console;
export function dateNow() {
    return Date.now() / 1_000;
}

export function logTraceapi(fn:string ,...args: any[]){ 
  if(WIN["traceapi"]){
      if( typeof c[fn] === 'function'){
        c[fn]('[TRACEAPI]', ...args)
      }
    }
}

export function requirePostitiveValue(v: number | undefined, name: string){
  if(v == undefined ||  (v && v > 0)) 
    return true;

    logTraceapi('warn',name +'='+ v + " <= 0");
  return false;
}

export function getNumberOrCall(o?: number | (() => number)): number | undefined {
  return typeof o === "function" ? o() : o;
}

export function getStringOrCall(o?: string | (() => string)): string | undefined {
  return typeof o === "function" ? o() : o;
}

export function detectBrowser() {
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

export function detectOs() {
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