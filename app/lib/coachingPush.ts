import {createECDH,createHmac,createCipheriv,createPrivateKey,randomBytes,sign} from "node:crypto";
export function allowedPushEndpoint(value:string){
 try{const u=new URL(value);return u.protocol==="https:"&&!u.port&&!u.username&&!u.password&&["fcm.googleapis.com","updates.push.services.mozilla.com","web.push.apple.com","push.services.mozilla.com"].some(h=>u.hostname===h||u.hostname.endsWith("."+h));}catch{return false;}
}
function hmac(key:Buffer,data:Buffer){return createHmac("sha256",key).update(data).digest();}
function expand(key:Buffer,info:Buffer,len:number){return hmac(key,Buffer.concat([info,Buffer.from([1])])).subarray(0,len);}
export async function sendPush(device:{endpoint:string;p256dh:string;auth:string},payload:{title:string;body:string;url:string;tag:string}){
 if(!allowedPushEndpoint(device.endpoint))return 400;
 const publicKey=Buffer.from(process.env.VAPID_PUBLIC_KEY||"","base64url"),privateKey=process.env.VAPID_PRIVATE_KEY||"";
 if(publicKey.length!==65||!privateKey)throw new Error("Push not configured");
 const receiver=Buffer.from(device.p256dh,"base64url"),auth=Buffer.from(device.auth,"base64url");
 if(receiver.length!==65||auth.length!==16)return 400;
 const ecdh=createECDH("prime256v1");ecdh.generateKeys();
 const sender=ecdh.getPublicKey(),shared=ecdh.computeSecret(receiver),salt=randomBytes(16);
 const ikm=expand(hmac(auth,shared),Buffer.concat([Buffer.from("WebPush: info\0"),receiver,sender]),32);
 const prk=hmac(salt,ikm),cek=expand(prk,Buffer.from("Content-Encoding: aes128gcm\0"),16),nonce=expand(prk,Buffer.from("Content-Encoding: nonce\0"),12);
 const cipher=createCipheriv("aes-128-gcm",cek,nonce);
 const encrypted=Buffer.concat([cipher.update(Buffer.concat([Buffer.from(JSON.stringify(payload)),Buffer.from([2])])),cipher.final(),cipher.getAuthTag()]);
 const header=Buffer.alloc(21);salt.copy(header);header.writeUInt32BE(4096,16);header[20]=sender.length;
 const jwtHeader=Buffer.from(JSON.stringify({typ:"JWT",alg:"ES256"})).toString("base64url");
 const jwtBody=Buffer.from(JSON.stringify({aud:new URL(device.endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:"mailto:notifications@gymlogapp.com"})).toString("base64url");
 const signingKey=createPrivateKey({key:{kty:"EC",crv:"P-256",x:publicKey.subarray(1,33).toString("base64url"),y:publicKey.subarray(33).toString("base64url"),d:privateKey},format:"jwk"});
 const input=jwtHeader+"."+jwtBody;
 const jwt=input+"."+sign("sha256",Buffer.from(input),{key:signingKey,dsaEncoding:"ieee-p1363"}).toString("base64url");
 const response=await fetch(device.endpoint,{method:"POST",headers:{Authorization:"vapid t="+jwt+", k="+publicKey.toString("base64url"),"Content-Encoding":"aes128gcm","Content-Type":"application/octet-stream",TTL:"300",Urgency:"normal"},body:new Uint8Array(Buffer.concat([header,sender,encrypted])),redirect:"error",signal:AbortSignal.timeout(3500)});
 return response.status;
}
