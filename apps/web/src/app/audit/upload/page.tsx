import { PanelShell } from "../../_components/panels/panel-shell";
import { BillUploadForm } from "../../_components/panels/bill-upload-form";

export default function AuditUploadPage() {
  return (
    <PanelShell
      description="فایل PDF یا تصویر قبض را بارگذاری کنید؛ استخراج داده در صف OCR انجام می‌شود."
      title="آپلود قبض برق"
    >
      <BillUploadForm />
    </PanelShell>
  );
}
