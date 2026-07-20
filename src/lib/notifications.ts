import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  relatedEntityId?: string;
  email?: string;
}

export async function createNotification(input: NotificationInput): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    notification_type: input.notificationType,
    related_entity_id: input.relatedEntityId ?? null
  });

  if (error) throw new Error(`Unable to store notification: ${error.message}`);

  if (input.email && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: input.email,
      subject: input.title,
      text: input.message
    });
  }
}
