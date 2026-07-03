import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        logger.warning("SMTP not configured – cannot send password reset email")
        return False

    subject = "Reset Your SOP Expert AI Password"
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <tr>
            <td style="padding:40px 32px 32px;text-align:center;background:linear-gradient(135deg,#6d4aff 0%,#8b5cf6 100%)">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">SOP Expert AI</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Password Reset Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 24px">
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;line-height:1.6">Hi there,</p>
              <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.6">
                We received a request to reset the password for your <strong>SOP Expert AI</strong> account.
                Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <div style="text-align:center;margin:28px 0">
                <a href="{reset_url}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6d4aff 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(109,74,255,0.35)">Reset Password</a>
              </div>
              <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.6">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;padding:12px 16px;background-color:#f4f4f5;border-radius:8px;font-size:12px;color:#6d4aff;word-break:break-all;font-family:monospace">{reset_url}</p>
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0" />
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.5">
                If you didn't request this, you can safely ignore this email.<br />
                &mdash; SOP Expert AI Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"SOP Expert AI <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        logger.info(f"Password reset email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {e}")
        return False
