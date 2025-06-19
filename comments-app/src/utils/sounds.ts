export const playNotificationSound = () => {
  const audio = new Audio("/notification.mp3");
  audio.volume = 0.3;
  audio.play().catch((e) => console.log("Audio play failed:", e));
};
