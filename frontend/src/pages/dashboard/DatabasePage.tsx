import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildBackendUrl, buildCitizenStatusUrl, getCookie } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

interface Citizen {
  id: number;
  name: string;
  national_id: string;
  address: string;
  status: string;
  picture: string;
  created_at: string;
  updated_at: string;
}

function statusVariant(
  status: string,
): "default" | "destructive" | "secondary" {
  switch (status) {
    case "Wanted":
      return "destructive";
    case "Free":
      return "default";
    default:
      return "secondary";
  }
}

export default function DatabasePage() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const citizensEndpoint = useMemo(() => buildBackendUrl("/api/citizens"), []);

  useEffect(() => {
    let aborted = false;
    async function loadCitizens() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(citizensEndpoint, {
          method: "GET",
          credentials: "include",
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => null);
          const message =
            data?.error || data?.detail || "Unable to load citizens.";
          if (!aborted) setError(message);
          return;
        }
        const data = await resp.json();
        if (!aborted) setCitizens(data.citizens || []);
      } catch (error) {
        if (!aborted)
          setError("Network error while loading citizens. Please try again.");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    loadCitizens();
    return () => {
      aborted = true;
    };
  }, [citizensEndpoint]);

  const handleStatusUpdate = async (citizenId: number, newStatus: string) => {
    try {
      // Get CSRF token from cookies
      const csrfToken = getCookie("csrftoken") || getCookie("csrf") || "";

      // Use the correct endpoint format from your Django views
      const action = newStatus.toLowerCase(); // 'wanted' or 'free'
      const resp = await fetch(
        buildCitizenStatusUrl(citizenId, action),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
        },
      );

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.detail ||
            `Failed to update status: ${resp.status}`,
        );
      }

      // Update the local state to reflect the change
      setCitizens(
        citizens.map((citizen) =>
          citizen.id === citizenId
            ? { ...citizen, status: newStatus }
            : citizen,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update status. Please try again.",
      );
      console.error("Status update error:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Intelligence Repository
          </h2>
          <p className="text-sm text-muted-foreground">
            Search, filter, and act on the central VigilantEye knowledge base.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => window.location.reload()}>
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Name
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  National ID
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Address
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground">
                    Loading citizens...
                  </td>
                </tr>
              ) : citizens.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground">
                    No citizens found.
                  </td>
                </tr>
              ) : (
                citizens.map((citizen) => (
                  <tr
                    key={citizen.id}
                    className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">{citizen.name}</td>
                    <td className="p-4 align-middle">
                      {citizen.national_id || "N/A"}
                    </td>
                    <td className="p-4 align-middle">{citizen.address}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={statusVariant(citizen.status)}>
                        {citizen.status}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {citizen.status === "Free" ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(citizen.id, "Wanted")
                          }>
                          Mark Wanted
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(citizen.id, "Free")
                          }>
                          Mark Found
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
