import { Badge, Card, CardContent } from "@xennic/ui";

const rows = [{ id: "—", file: "قبض نمونه.pdf", status: "در صف OCR", amount: "—" }];

/** فهرست قبوض (فاز ۱: داده‌ی نمونه؛ اتصال به GET /audit/history در فاز ۲) */
export function RecentBills() {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr>
              <th className="p-3 text-right font-medium">فایل</th>
              <th className="p-3 text-right font-medium">وضعیت</th>
              <th className="p-3 text-left font-medium">مبلغ نهایی</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-border/60" key={row.file}>
                <td className="p-3">{row.file}</td>
                <td className="p-3">
                  <Badge variant="muted">{row.status}</Badge>
                </td>
                <td className="xennic-numeric p-3 text-left">{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
