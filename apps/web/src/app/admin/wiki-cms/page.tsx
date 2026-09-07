import { PanelShell } from "../../_components/panels/panel-shell";
import { AdminSectionStub } from "../../_components/admin/admin-section-stub";

/** CMS دانشنامه — بخش Super Admin پنل مدیریت */
export default function AdminWikiCmsPage() {
  return (
    <PanelShell description="انتشار و ویرایش اسناد دانشنامه — POST /admin/wiki" title="CMS دانشنامه">
      <AdminSectionStub />
    </PanelShell>
  );
}
