import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AppStateService } from "../common/app-state.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly state: AppStateService) {}

  @Get("me")
  me() {
    return this.state.me();
  }

  @Post("login")
  login(@Body() body: Record<string, unknown>) {
    return this.state.login(String(body.email ?? "admin@powerlytic.com"));
  }

  @Post("refresh")
  refresh(@Body() body: Record<string, unknown>) {
    const userId = String(body.userId ?? "usr-admin");
    const user = this.state.getUser(userId);
    return {
      user,
      accessToken: `dev-access-${user.id}-${Date.now()}`,
      refreshToken: `dev-refresh-${user.id}-${Date.now()}`
    };
  }

  @Post("request-reset")
  requestReset(@Body() body: Record<string, unknown>) {
    return {
      email: body.email,
      resetToken: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString()
    };
  }

  @Post("reset-password")
  resetPassword() {
    return { message: "Password reset successful" };
  }

  @Post("logout")
  logout() {
    return { success: true };
  }

  @Get("oidc/:provider/start")
  startOidc(@Param("provider") provider: string) {
    return {
      provider,
      authorizationUrl: `${process.env.OIDC_ISSUER_URL ?? "http://localhost:8080/realms/powerlytic"}/protocol/openid-connect/auth`,
      note: "Frontend should use Authorization Code + PKCE against this provider."
    };
  }

  @Get("oidc/:provider/callback")
  oidcCallback(@Param("provider") provider: string) {
    return {
      provider,
      note: "Exchange the authorization code server-side or through the configured OIDC client."
    };
  }
}
