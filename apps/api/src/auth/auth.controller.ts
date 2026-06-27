import { All, Controller, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from './better-auth.handler';
import { Public } from '../common/decorators/require-permission.decorator';

@Controller('api/auth')
export class AuthController {
  @Public()
  @All('*')
  async handleAuth(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    const response = await auth.handler(
      new Request(url.toString(), {
        method: req.method,
        headers: req.headers as Record<string, string | string[]>,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      })
    );

    reply.status(response.status);
    // Skip CORS headers — NestJS enableCors() owns them. Better Auth writes its
    // own CORS headers based on trustedOrigins, and forwarding them here would
    // overwrite what the @fastify/cors plugin already set correctly.
    const skipHeaders = new Set(['access-control-allow-origin', 'access-control-allow-credentials', 'access-control-allow-methods', 'access-control-allow-headers', 'access-control-expose-headers', 'access-control-max-age']);
    response.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) reply.header(key, value);
    });
    const text = await response.text();
    reply.send(text ? JSON.parse(text) : null);
  }
}
