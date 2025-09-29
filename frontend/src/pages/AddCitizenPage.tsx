import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  Loader2,
  Upload,
  User,
  MapPin,
  IdCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildAddCitizenUrl, getCookie } from "@/lib/utils";

const addCitizenSchema = z.object({
  name: z.string().min(1, "Name is required"),
  national_id: z.string().min(1, "National ID is required"),
  address: z.string().min(1, "Address is required"),
  image: z.instanceof(File, { message: "Image is required" }),
});

export default function AddCitizenPage() {
  const [values, setValues] = useState({
    name: "",
    national_id: "",
    address: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const csrfToken = getCookie("csrftoken") || getCookie("csrf") || "";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = addCitizenSchema.safeParse({
      ...values,
      image: imageFile,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message || "Please fix the errors and try again");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", parsed.data.name);
      formData.append("national_id", parsed.data.national_id);
      formData.append("address", parsed.data.address);
      formData.append("image", parsed.data.image);

      const resp = await fetch(buildAddCitizenUrl(), {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: formData,
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setSuccess(data.message || "Citizen successfully added!");
        // Reset form
        setValues({ name: "", national_id: "", address: "" });
        setImageFile(null);
        // Reset file input
        const fileInput = document.getElementById("image") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/dashboard/database");
        }, 2000);
      } else {
        setError(data.error || "Failed to add citizen");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add Citizen/Thief
          </CardTitle>
          <CardDescription>
            Add a new person to the criminal detection system database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter full name"
                  className="pl-9"
                  value={values.name}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, name: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="national_id" className="text-sm font-medium">
                National ID
              </Label>
              <div className="relative">
                <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="national_id"
                  name="national_id"
                  placeholder="Enter national ID number"
                  className="pl-9"
                  value={values.national_id}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, national_id: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter full address"
                  className="pl-9"
                  value={values.address}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, address: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-medium">
                Picture
              </Label>
              <div className="relative">
                <Upload className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  className="pl-9"
                  onChange={handleImageChange}
                  required
                />
              </div>
              {imageFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {imageFile.name}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding Citizen...
                </span>
              ) : (
                "Add Citizen"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
