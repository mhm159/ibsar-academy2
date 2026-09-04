"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem("cookie-consent");
    if (!hasConsented) {
      const t = setTimeout(() => setShow(true), 0);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50 animate-in slide-in-from-bottom-5">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground flex-1">
          نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك على منصتنا وتحليل الزيارات. باستمرارك في استخدام الموقع، فإنك توافق على{" "}
          <a href="/privacy-policy" className="text-primary underline hover:text-primary/80">
            سياسة الخصوصية
          </a>{" "}
          الخاصة بنا.
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAccept} size="sm">
            موافق
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShow(false)}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 ml-1" /> إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}
