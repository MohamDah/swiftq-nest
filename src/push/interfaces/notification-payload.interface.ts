export interface NotificationPayload {
  title: string;
  body: string;
  data: {
    qrCode: string;
  };
}
