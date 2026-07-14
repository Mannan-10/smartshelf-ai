"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { settingsApi, ShopSettings } from "@/lib/settings-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

const settingsSchema = z.object({
  shopName: z.string().min(1, "Shop Name is required").max(100),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  currency: z.string().min(1, "Currency is required").max(3),
  address: z.string().optional().or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      shopName: "",
      contactEmail: "",
      currency: "USD",
      address: "",
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await settingsApi.getSettings();
        if (data) {
          form.reset({
            shopName: data.shopName || "",
            contactEmail: data.contactEmail || "",
            currency: data.currency || "USD",
            address: data.address || "",
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [form]);

  async function onSubmit(values: SettingsFormValues) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await settingsApi.updateSettings({
        shopName: values.shopName,
        contactEmail: values.contactEmail || undefined,
        currency: values.currency,
        address: values.address || undefined,
      });
      setSuccess("Settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your shop preferences.</p>
      </div>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Shop Details</CardTitle>
          <CardDescription>Update your shop configuration and details.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert className="mb-4 border-green-500 bg-green-50 text-green-900"><AlertDescription>{success}</AlertDescription></Alert>}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Shop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Code</FormLabel>
                    <FormControl>
                      <Input placeholder="USD" maxLength={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={saving} className="mt-4">
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
