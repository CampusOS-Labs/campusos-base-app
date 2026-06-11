export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 0,
    });
  });
}

export function geolocationErrorMessage(err: GeolocationPositionError | Error): string {
  if ("code" in err) {
    if (err.code === err.PERMISSION_DENIED) {
      return "Location permission denied. Enable location access in your browser settings and try again.";
    }
    if (err.code === err.POSITION_UNAVAILABLE) {
      return "Could not determine your location. Try moving outdoors or enabling GPS.";
    }
    if (err.code === err.TIMEOUT) {
      return "Location request timed out. Please try again.";
    }
  }
  return err.message || "Could not get your location.";
}

export function formatCheckInTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
}
