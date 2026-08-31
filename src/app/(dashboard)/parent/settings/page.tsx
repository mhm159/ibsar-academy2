"use client";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageHeader } from "@/components/dashboard/ui-bits";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ParentSettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirm("هل أنت متأكد من رغبتك في حذف الحساب نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف بيانات جميع الأبناء.")) {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
        if (res.ok) {
          window.location.href = "/";
        } else {
          alert("حدث خطأ أثناء حذف الحساب.");
        }
      } catch (e) {
        alert("حدث خطأ في الاتصال.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DashboardShell role="PARENT">
      <PageHeader title="الإعدادات" description="إدارة حسابك وتفضيلات الخصوصية" />
      <Card className="p-6 mt-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">منطقة الخطر (Danger Zone)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          حذف حسابك سيؤدي إلى مسح جميع البيانات المرتبطة بك وبأبنائك بشكل نهائي من خوادمنا. لا يمكن استرجاع البيانات بعد الحذف.
        </p>
        <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
          {loading ? "جاري الحذف..." : "حذف الحساب نهائياً"}
        </Button>
      </Card>
    </DashboardShell>
  );
}
