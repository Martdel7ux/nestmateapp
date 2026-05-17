// Supabase Edge Function: process-document
// Called client-side after upload to extract page count from PDFs.
// Future: could add OCR via an external service.
// Request body: { document_id: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { document_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { document_id } = body;
  if (!document_id) {
    return new Response("Missing document_id", { status: 400 });
  }

  // Verify the document exists
  const { data: doc, error: fetchErr } = await supabase
    .from("documents")
    .select("id, storage_path, mime_type, ocr_status")
    .eq("id", document_id)
    .maybeSingle();

  if (fetchErr || !doc) {
    return new Response("Document not found", { status: 404 });
  }

  // Mark as processing
  await supabase.from("documents").update({ ocr_status: "processing" }).eq("id", document_id);

  try {
    // Download the file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("documents")
      .download(doc.storage_path);

    if (dlErr || !fileData) throw dlErr ?? new Error("Download failed");

    let pageCount: number | null = null;

    // For PDFs: count pages by looking for /Type /Page entries in raw bytes
    if (doc.mime_type === "application/pdf") {
      const buf  = await fileData.arrayBuffer();
      const text = new TextDecoder("latin1").decode(buf);
      // Simple heuristic: count "obj" markers that contain "/Type /Page"
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      pageCount = matches ? matches.length : null;
    }

    await supabase.from("documents").update({
      ocr_status: "skipped", // OCR not implemented — mark skipped
      page_count: pageCount,
    }).eq("id", document_id);

    return new Response(JSON.stringify({ document_id, page_count: pageCount, ocr_status: "skipped" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    await supabase.from("documents").update({ ocr_status: "failed" }).eq("id", document_id);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
