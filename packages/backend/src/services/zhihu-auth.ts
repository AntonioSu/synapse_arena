import crypto from 'crypto';
import { config } from '../config';

export class ZhihuAuth {
  private appKey: string;
  private appSecret: string;

  constructor() {
    this.appKey = config.zhihu.appKey;
    this.appSecret = config.zhihu.appSecret;
  }

  generateHeaders(): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const logId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const extraInfo = '';
    
    const signStr = `app_key:${this.appKey}|ts:${timestamp}|logid:${logId}|extra_info:${extraInfo}`;
    
    const hmac = crypto.createHmac('sha256', this.appSecret);
    hmac.update(signStr);
    const signature = hmac.digest('base64');
    
    return {
      'X-App-Key': this.appKey,
      'X-Timestamp': timestamp,
      'X-Log-Id': logId,
      'X-Sign': signature,
      'X-Extra-Info': extraInfo,
    };
  }
}

export const zhihuAuth = new ZhihuAuth();
