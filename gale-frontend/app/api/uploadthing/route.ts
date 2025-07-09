import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";
import { UTApi } from "uploadthing/server";
import { NextRequest, NextResponse } from "next/server";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

const utapi = new UTApi();

export async function DELETE(req: NextRequest) {
  try {
    const { fileKey } = await req.json();
    
    if (!fileKey) {
      return NextResponse.json(
        { error: "fileKey is required in request body" },
        { status: 400 }
      );
    }

    await utapi.deleteFiles(fileKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting uploadthing file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
