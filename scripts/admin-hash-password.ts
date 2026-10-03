import { randomBytes } from "node:crypto";
import { hashPortalPassword } from "../src/lib/admin-password";

async function readPassword(): Promise<string> {
  if(!process.stdin.isTTY) {let value="";for await(const chunk of process.stdin) {value+=chunk.toString();if(value.length>1000) throw new Error("Password input is too long.");}return value.replace(/[\r\n]+$/,"");}
  process.stderr.write("Password (12+ characters, hidden): ");process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding("utf8");
  return new Promise((resolve,reject)=>{let value="";const end=()=>{process.stdin.setRawMode(false);process.stdin.pause();process.stdin.removeListener("data",data);process.stderr.write("\n");};const data=(chunk:string)=>{for(const character of chunk){if(character==="\u0003"){end();reject(new Error("Cancelled."));return;}if(character==="\r"||character==="\n"){end();resolve(value);return;}if(character==="\u007f"||character==="\b") value=value.slice(0,-1);else if(character>=" "&&value.length<201)value+=character;}};process.stdin.on("data",data);});
}
async function main(){const hash=await hashPortalPassword(await readPassword());console.log(`ADMIN_PORTAL_PASSWORD_HASH=${hash}`);if(process.argv.includes("--with-secret")) console.log(`ADMIN_PORTAL_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);}
main().catch(error=>{console.error(error instanceof Error?error.message:"Password generation failed.");process.exitCode=1;});
