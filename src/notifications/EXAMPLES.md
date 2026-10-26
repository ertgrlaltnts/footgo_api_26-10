# Bildirim API Kullanım Örnekleri

Bildirimler Expo Push API üzerinden gönderilir. Uygulama açıldığında Expo push token'ını `POST /notifications/devices` ile kaydeder. Panelden gönderilen bildirim, kayıtlı her cihaza o cihazın diline göre iletilir.

Bildirim ikonu uygulama tarafında `expo-notifications` eklentisiyle ayarlanır. Sunucu ikon adı göndermez. Android kanal kimliği `default` olmalıdır.

---

## 1. Cihaz kaydı

### Endpoint

```
POST /notifications/devices
```

### Örnek Request Body

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "locale": "tr",
  "platform": "android"
}
```

Aynı token tekrar gelirse kayıt güncellenir. Geçersiz token `400` döner.

### Kayıtlı cihaz sayısı

```
GET /notifications/devices/count
```

```json
{ "count": 128 }
```

---

## 2. sendNotification - Bildirim Gönderme

### Endpoint

```
POST /notifications/send
```

### Örnek Request Body

```json
{
  "headings": {
    "en": "Welcome to FootGo!",
    "tr": "FootGo'ya Hoş Geldiniz!",
    "fr": "Bienvenue sur FootGo!",
    "es": "¡Bienvenido a FootGo!"
  },
  "contents": {
    "en": "Thank you for using our app. Start making predictions now!",
    "tr": "Uygulamayı kullandığınız için teşekkürler. Şimdi tahmin yapmaya başlayın!",
    "fr": "Merci d'utiliser notre application. Commencez à faire des prédictions maintenant!",
    "es": "Gracias por usar nuestra aplicación. ¡Comienza a hacer predicciones ahora!"
  },
  "saveToDatabase": true
}
```

Dil seçimi cihazın `locale` alanına göre yapılır. Eşleşme yoksa sıra `tr`, `en`, `fr`, `es` şeklindedir.

### Örnek Response

```json
{
  "success": true,
  "recipients": 120,
  "message": "Bildirim 120 cihaza gönderildi",
  "notification": {
    "provider": "expo",
    "recipientsCount": 120
  }
}
```

Kayıtlı cihaz yoksa `success: false` ve `recipients: 0` döner.

---

## 3. Kayıtlı bildirimleri listeleme, yeniden gönderme ve silme

```
GET /notifications?page=1&limit=20
GET /notifications/:id
POST /notifications/:id/resend
DELETE /notifications/:id
```

Yeniden gönderme kaydı kopyalamaz; güncel cihaz listesine Expo bildirimi yollar.
