import { useRef, useState } from "react";
import { Loader2, ShieldCheck, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useData } from "@/contexts/data-context";

export function VerificationUpload() {
  const { snapshot, submitVerification } = useData();
  const verification = snapshot.verifications.find(
    (v) => v.landlord_id === snapshot.profile.id
  );

  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const idRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) return;
    setUploading(true);
    await submitVerification(idFile, selfieFile);
    setUploading(false);
  };

  if (verification?.verification_status === "approved") {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-sky-500" size={22} />
          <h3 className="font-display text-2xl">Identity Verified</h3>
        </div>
        <Badge className="w-fit bg-sky-500/10 text-sky-600">
          <ShieldCheck size={12} />
          Verified Landlord
        </Badge>
        <p className="text-sm text-muted-foreground">
          Your identity has been reviewed and approved. Your listings now display a verified
          badge.
        </p>
      </Card>
    );
  }

  if (verification?.verification_status === "pending") {
    return (
      <Card className="space-y-4">
        <h3 className="font-display text-2xl">Under Review</h3>
        <Badge className="w-fit bg-amber-500/10 text-amber-600">Pending admin review</Badge>
        <p className="text-sm text-muted-foreground">
          Your ID card and selfie have been submitted. An admin will review within 24 hours
          and notify you.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div>
        <h3 className="font-display text-2xl">Get Verified</h3>
        <p className="text-sm text-muted-foreground">
          Upload your government-issued ID and a clear selfie. An admin will manually review
          and grant your verified badge.
        </p>
        {verification?.verification_status === "rejected" && (
          <div className="mt-3 rounded-[1rem] bg-destructive/10 p-3 text-sm text-destructive">
            <strong>Rejected:</strong>{" "}
            {verification.admin_notes ??
              "Documents did not meet requirements. Please resubmit."}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          className="cursor-pointer rounded-[1.5rem] border-2 border-dashed border-border p-6 text-center transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => idRef.current?.click()}
        >
          {idPreview ? (
            <img
              src={idPreview}
              alt="ID card preview"
              className="h-32 w-full rounded-xl object-cover"
            />
          ) : (
            <>
              <Upload className="mx-auto text-muted-foreground" size={24} />
              <p className="mt-2 text-sm font-medium">Upload ID Card</p>
              <p className="text-xs text-muted-foreground">
                Passport, national ID or driving licence
              </p>
            </>
          )}
          <input
            ref={idRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleIdChange}
          />
        </button>

        <button
          type="button"
          className="cursor-pointer rounded-[1.5rem] border-2 border-dashed border-border p-6 text-center transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => selfieRef.current?.click()}
        >
          {selfiePreview ? (
            <img
              src={selfiePreview}
              alt="Selfie preview"
              className="h-32 w-full rounded-xl object-cover"
            />
          ) : (
            <>
              <Upload className="mx-auto text-muted-foreground" size={24} />
              <p className="mt-2 text-sm font-medium">Take a Selfie</p>
              <p className="text-xs text-muted-foreground">Clear photo of your face</p>
            </>
          )}
          <input
            ref={selfieRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleSelfieChange}
          />
        </button>
      </div>

      <Button
        className="w-full"
        disabled={!idFile || !selfieFile || uploading}
        onClick={handleSubmit}
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Uploading…
          </>
        ) : (
          "Submit for Review"
        )}
      </Button>
    </Card>
  );
}
