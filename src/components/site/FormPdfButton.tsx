// src/components/site/FormPdfButton.tsx
import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getRequestFormPdf } from "@/lib/pdf.functions";

export function FormPdfButton({ requestId }: { requestId: string }) {
  const getPdf = useServerFn(getRequestFormPdf);
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const { filename, base64 } = await getPdf({ data: { id: requestId } });
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={download} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
      Filled form (PDF)
    </Button>
  );
}