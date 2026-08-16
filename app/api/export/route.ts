import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { buildSnapshot } from "@/lib/integration/snapshot";
import { jsonExportAdapter } from "@/lib/integration/adapters";

/**
 * The JSON export, driven through the integration port rather than around it.
 *
 * The route builds a snapshot and hands it to a registered adapter; it does not
 * serialise anything itself. That is what makes the seam real — swapping the
 * adapter changes where the data goes without touching this file.
 */
export async function GET(): Promise<Response> {
  const user = await getSessionUser();

  if (!user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!can(user.role, "manage", "user")) {
    return Response.json(
      { error: "Exporting the full operating picture is restricted to administrators." },
      { status: 403 },
    );
  }

  const snapshot = await buildSnapshot();
  const result = await jsonExportAdapter.exportSnapshot!(snapshot);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  const filename = `viemo-snapshot-${snapshot.takenAt.slice(0, 10)}.json`;

  return new Response(result.payload as string, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
