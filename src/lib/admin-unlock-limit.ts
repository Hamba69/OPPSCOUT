import "server-only";
import { randomUUID } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

const reserveScript=`local key=KEYS[1]
local now=tonumber(ARGV[1])
redis.call('ZREMRANGEBYSCORE',key,'-inf',now-3600000)
local short=redis.call('ZCOUNT',key,now-900000,'+inf')
local long=redis.call('ZCARD',key)
if short>=5 or long>=20 then
 local range=redis.call('ZRANGEBYSCORE',key,short>=5 and now-900000 or '-inf','+inf','WITHSCORES','LIMIT',0,1)
 return math.max(1,math.ceil((tonumber(range[2])+(short>=5 and 900000 or 3600000)-now)/1000))
end
redis.call('ZADD',key,now,ARGV[2])
redis.call('PEXPIRE',key,3600000)
return 0`;
async function redis(command: Array<string | number>): Promise<unknown> {
  const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url || !token) throw new AppError("Rate limiting is not configured.",503,"RATE_LIMIT_NOT_CONFIGURED");
  try {const response=await fetch(url,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify(command),signal:AbortSignal.timeout(3000)});if(!response.ok) throw new Error();const result=await response.json() as {result?:unknown;error?:string};if(result.error || result.result===undefined) throw new Error();return result.result;}catch{throw new AppError("Rate limiting is unavailable.",503,"RATE_LIMIT_STORE_ERROR");}
}
export async function reserveUnlock(ipHash: string,now=Date.now()): Promise<()=>Promise<void>> {
  const key=`admin-unlock:${ipHash}`,id=randomUUID();const retry=Number(await redis(["EVAL",reserveScript,1,key,now,id]));
  if(!Number.isFinite(retry)) throw new AppError("Rate limiting is unavailable.",503,"RATE_LIMIT_STORE_ERROR");
  if(retry>0) throw new AppError("Too many attempts. Please try again later.",429,"RATE_LIMITED",{retryAfterSeconds:retry});
  return async()=>{await redis(["ZREM",key,id]);};
}
