import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Badge removed — dummy camera grid removed so badge is not used here.
import { Camera } from "lucide-react";
import { useRef, useState, useEffect } from "react";
// Removed dummy camera grid. This page focuses on uploading images and
// using the browser webcam for detection. Server-side webcam (OpenCV)
// remains available through the 'Open Webcam' link which opens the
// template page that runs server-side detection.

export default function LiveMonitoringPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [detections, setDetections] = useState<any[] | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [imgDisplay, setImgDisplay] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDetection, setActiveDetection] = useState<any | null>(null);

  // Open the server-side webcam route in a new tab so the SPA router doesn't intercept it.
  // If your Django server runs on a different host/port, change backendPort accordingly.
  const openWebcam = () => {
    const host = window.location.hostname;
    const backendPort = 8000; // adjust if Django runs on another port
    const url = `${window.location.protocol}//${host}:${backendPort}/detectWithWebcam`;
    window.open(url, "_blank");
  };
  // During development we usually run the frontend on 5173 (Vite) and the
  // Django backend on 8000. Use a fixed backend base to ensure requests go
  // to Django rather than being handled by the dev server which returns 404.
  // If your backend runs elsewhere, change this value.
  const apiBase = "http://127.0.0.1:8000";

  // file input is triggered directly where needed

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${apiBase}/api/detect-image`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        console.error("detect-image failed", text);
        setDetections(null);
        setError("Server error while analyzing image");
        return;
      }
      const body = await res.json();
      setDetections(body.detections || null);
      if (body.image_url) {
        const imgUrl = body.image_url.startsWith("http")
          ? body.image_url
          : `${apiBase}${body.image_url}`;
        setResultImageUrl(imgUrl);
      } else {
        setResultImageUrl(null);
      }
    } catch (err) {
      console.error(err);
      setDetections(null);
      setError("Network error while sending image");
    } finally {
      setLoading(false);
    }
  };

  // Browser webcam helpers (optional): start/stop + capture a frame and send to the same API
  const startBrowserCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Failed to access camera", err);
    }
  };

  const stopBrowserCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureFrameAndSend = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setError(null);
      setLoading(true);
      const form = new FormData();
      form.append("image", blob, "capture.png");
      try {
        const res = await fetch(`${apiBase}/api/detect-image`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          console.error("capture detect-image failed", text);
          setDetections(null);
          setError("Server error while analyzing capture");
          return;
        }
        const body = await res.json();
        setDetections(body.detections || null);
        if (body.image_url) {
          const imgUrl = body.image_url.startsWith("http")
            ? body.image_url
            : `${apiBase}${body.image_url}`;
          setResultImageUrl(imgUrl);
        } else {
          setResultImageUrl(null);
        }
      } catch (err) {
        console.error(err);
        setDetections(null);
        setError("Network error while sending capture");
      } finally {
        setLoading(false);
      }
    }, "image/png");
  };

  // Recompute display size when image loads or container resizes
  useEffect(() => {
    if (!imageRef.current || !imageContainerRef.current) return;
    const img = imageRef.current;
    const container = imageContainerRef.current;

    const recompute = () => {
      if (!img) return;
      setImgDisplay({ w: img.clientWidth, h: img.clientHeight });
    };

    recompute();

    const ro = new (window as any).ResizeObserver(recompute);
    ro.observe(container);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [resultImageUrl]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Server webcam (50%) */}
        <Card className="flex flex-col h-full">
          <div className="flex-1 flex flex-col">
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src="/webcam.jpg"
                alt="webcam"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold">Open server webcam</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Opens the template page that runs server-side webcam detection
                (OpenCV window on the server).
              </p>
              <div className="mt-auto">
                <Button onClick={openWebcam} className="w-full">
                  Open Webcam
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Card: Upload picture (50%) */}
        <Card className="flex flex-col h-full">
          <div className="flex-1 flex flex-col">
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src="/uploadimage.jpg"
                alt="upload"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold">Upload a picture</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Upload a photo to analyze and compare faces against the
                watchlist.
              </p>
              <div className="mt-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full">
                  Choose file
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <section className="mt-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Browser webcam (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={startBrowserCamera}
                  className="gap-2">
                  <Camera className="h-4 w-4" />
                  Start camera
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={stopBrowserCamera}
                  className="gap-2">
                  Stop camera
                </Button>
                <Button
                  type="button"
                  onClick={captureFrameAndSend}
                  className="gap-2">
                  Capture & analyze
                </Button>
              </div>

              <div
                className="relative w-full bg-gray-100 rounded-md overflow-hidden"
                style={{ aspectRatio: "16/9", maxHeight: "400px" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full ${
                    videoRef.current?.srcObject ? "block" : "hidden"
                  }`}
                />
                {!videoRef.current?.srcObject && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400 mb-2">
                      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
                      <path d="M6 18h12" />
                      <path d="M6 14h.01" />
                      <path d="M10 14h4" />
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">
                      Click "Start camera" to begin
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result image with overlay boxes */}
        {resultImageUrl && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={imageContainerRef} className="relative inline-block">
                <img
                  ref={imageRef}
                  src={resultImageUrl}
                  alt="result"
                  className="max-w-full h-auto block"
                  onLoad={(ev) => {
                    const img = ev.currentTarget as HTMLImageElement;
                    setImgNatural({
                      w: img.naturalWidth,
                      h: img.naturalHeight,
                    });
                    setImgDisplay({ w: img.clientWidth, h: img.clientHeight });
                  }}
                />

                {detections &&
                  detections.map((d: any, i: number) => {
                    const [top, right, bottom, left] = d.box || [0, 0, 0, 0];
                    // compute scale from natural to displayed
                    const scaleX =
                      imgNatural && imgDisplay
                        ? imgDisplay.w / imgNatural.w
                        : 1;
                    const scaleY =
                      imgNatural && imgDisplay
                        ? imgDisplay.h / imgNatural.h
                        : 1;
                    const leftPx = Math.round(left * scaleX);
                    const topPx = Math.round(top * scaleY);
                    const widthPx = Math.round((right - left) * scaleX);
                    const heightPx = Math.round((bottom - top) * scaleY);

                    const boxClass =
                      d.status === "Match"
                        ? "ve-box ve-box-match"
                        : d.status === "Low confidence"
                        ? "ve-box ve-box-low"
                        : "ve-box ve-box-unknown";

                    return (
                      <div key={i}>
                        <div
                          className={boxClass}
                          style={{
                            left: leftPx,
                            top: topPx,
                            width: Math.max(0, widthPx),
                            height: Math.max(0, heightPx),
                          }}
                          onClick={() => setActiveDetection(d)}
                        />

                        <div
                          className={`ve-label ${
                            d.status === "Match" ? "ve-label-match" : ""
                          }`}
                          style={{ left: leftPx, top: topPx + heightPx + 6 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}>
                            {d.avatar_url && (
                              <img
                                src={d.avatar_url}
                                alt="avatar"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 4,
                                  objectFit: "cover",
                                }}
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: 600 }}>{d.name}</div>
                              <div style={{ fontSize: 11 }}>
                                {d.status} — {d.confidence}%
                              </div>
                              {d.national_id && (
                                <div style={{ fontSize: 11 }}>
                                  ID: {d.national_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {loading && (
                  <div className="ve-loading-overlay">
                    <div className="ve-spinner" />
                    <div className="ve-loading-text">Analyzing image…</div>
                  </div>
                )}

                {error && <div className="ve-error">{error}</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {detections && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Detections</CardTitle>
            </CardHeader>
            <CardContent>
              {detections.length === 0 && <div>No matches found.</div>}
              {detections.map((d: any, i: number) => (
                <div key={i} className="py-2">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.status} — {d.confidence}%
                  </div>
                  <div className="text-xs">ID: {d.national_id}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active detection detail card (small) */}
        {activeDetection && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Detection details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-start">
                {activeDetection.avatar_url && (
                  <img
                    src={activeDetection.avatar_url}
                    alt="avatar"
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                )}
                <div>
                  <div className="font-medium text-lg">
                    {activeDetection.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activeDetection.status} — {activeDetection.confidence}%
                  </div>
                  {activeDetection.national_id && (
                    <div className="text-xs mt-2">
                      ID: {activeDetection.national_id}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline">View profile</Button>
                    <Button variant="destructive">Mark false positive</Button>
                    <Button onClick={() => setActiveDetection(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
