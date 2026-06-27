import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export class BridgeClient {
  private readonly baseUrl = process.env.BRIDGE_BASE_URL;
  private readonly token = process.env.BRIDGE_API_TOKEN;
  private readonly hmacSecret = process.env.BRIDGE_HMAC_SECRET;

  private sign(body: string): string {
    return createHmac('sha256', this.hmacSecret!).update(body).digest('hex');
  }

  async sendConfig(payload: unknown): Promise<void> {
    const body = JSON.stringify(payload);
    const sig = this.sign(body);

    const res = await fetch(`${this.baseUrl}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'X-Signature': sig,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new InternalServerErrorException(`Bridge rejected config: ${text}`);
    }
  }

  verifySignature(body: string, signature: string): boolean {
    const expected = this.sign(body);
    return expected === signature;
  }
}
