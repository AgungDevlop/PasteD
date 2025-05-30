self.addEventListener('push', function(event) {
  const data = event.data.json();
  const title = data.notification.title;
  const options = {
    body: data.notification.body,
    icon: data.notification.icon,
    badge: data.notification.badge,
    data: data.notification.data,  // Store the URL from the notification
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  const url = event.notification.data.url || 'https://example.com';  // Default URL if not provided
  event.notification.close();  // Close the notification

  event.waitUntil(
    clients.openWindow(url)  // Open the URL when notification is clicked
  );
});
