import UploadBox from "@/components/upload-box";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";

export default function UploadPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Upload a document</CardTitle>
            <CardDescription>
              We will extract the textual content and map highlights so you can
              review the document alongside the original PDF preview.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <UploadBox />
        </CardContent>
      </Card>
    </div>
  );
}
